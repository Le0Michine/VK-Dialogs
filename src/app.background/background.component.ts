import { Component, OnInit, OnDestroy } from "@angular/core";
import { Http } from "@angular/http";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import "rxjs/add/Observable/interval";
import "rxjs/add/Observable/timer";
import "rxjs/add/observable/combineLatest";
import "rxjs/add/operator/throttleTime";

import { VKConsts } from "../app/vk-consts";
import { SessionInfo, DialogListInfo, HistoryInfo } from "./datamodels";
import { sendMessagePending, typeMessage, setBadge } from "./actions";

import { AuthHelper } from "./auth-helper";
import { VKService } from "./services";
import { UserService } from "./services";
import { DialogService } from "./services";
import { LPSService } from "./services";
import { ChromeAPIService } from "./services";
import { FileUploadService } from "./services";
import { OptionsService } from "./services";
import { Channels } from "./channels";
import { AppBackgroundState } from "./app-background.store";

@Component({
    selector: "background-app",
    template: "<span>Background component</span>",
})
export class BackgroundComponent implements OnInit, OnDestroy {
    private lastOpenedConversation: any = null;
    private subscriptions: Subscription[] = [];

    constructor(
        private store: Store<AppBackgroundState>,
        private http: Http,
        private dialogsService: DialogService,
        private userService: UserService,
        private vkservice: VKService,
        private lps: LPSService,
        private chromeapi: ChromeAPIService,
        private fileUpload: FileUploadService,
        private settings: OptionsService
    ) { }

    ngOnInit() {
        this.chromeapi.AcceptConnections();
        this.chromeapi.init();

        console.log("background init");
        this.subscriptions.push(this.store.select(s => s.actionBadge).subscribe(v => this.chromeapi.UpdateActionBadge(v)));
        Observable.combineLatest(this.store.select(s => s.dialogs), this.store.select(s => s.isAuthorized))
            .map(([ dialogs, isAuthorized ]) => !isAuthorized ? "off" : dialogs.unread ? dialogs.unread + "" : "")
            .subscribe(value => this.store.dispatch(setBadge(value)));

        this.vkservice.auth().subscribe(
            (session) => {
                if (!session) {
                    chrome.contextMenus.removeAll();
                }
                else {
                    this.initServices();
                    this.createContextMenuItems();
                }
            }
        );

        this.chromeapi.registerObservable(this.store.select(s => s.chats).map(x => { return { name: "chats_update", data: x }; }));
        this.chromeapi.registerObservable(this.store.select(s => s.dialogs).map(x => { return { name: "dialogs_update", data: x }; }));
        this.chromeapi.registerObservable(this.store.select(s => s.history).map(x => { return { name: "history_update", data: x }; }));
        this.chromeapi.registerObservable(this.store.select(s => s.users).map(x => { return { name: "users_update", data: x }; }));
        this.chromeapi.registerObservable(this.store.select(s => s.inputMessages).map(x => { return { name: "input_message", data: x }; }));

        this.waitForAuthorizeRequest();

        this.subscriptions.push(
            this.chromeapi.OnMessage("logoff")
                .subscribe(() => this.logOff())
        );

        this.subscriptions.push(
            this.chromeapi.OnMessage("get_file_server")
                .subscribe(message => {
                    console.log("get file server to upload");
                    this.fileUpload.getServerUrl()
                        .subscribe(server => message.sendResponse({ data: server }));
                    return true;
                })
        );

        this.subscriptions.push(
            this.chromeapi.OnMessage("get_message_photo")
                .subscribe(message => {
                    console.log("get photo for message");
                    this.fileUpload.getPhoto(message.data)
                        .subscribe(photo => message.sendResponse({ data: photo }));
                    return true;
                })
        );

        this.subscriptions.push(
            this.chromeapi.OnMessage("open_separate_window")
                .subscribe((size) => this.openSeparateWindow(size.w, size.h))
        );

        this.subscriptions.push(
            this.chromeapi.OnMessage("set_online")
                .throttleTime(1000 * 60 * 10)
                .subscribe((message: any) => {
                    this.setOnline();
                    return false;
                })
        );

        this.subscriptions.push(
            this.chromeapi.OnMessage("set_active")
                .subscribe((message: any) => {
                    this.setActive();
                    return false;
                })
        );

        this.subscriptions.push(
            this.chromeapi.OnMessage(Channels.markAsReadRequest).subscribe((message: any) => {
                this.dialogsService.markAsRead(message.message_ids).subscribe(response => {
                    message.sendResponse({data: response});
                    console.log("mark as read result: ", response);
                });
                return true;
            })
        );
    }

    ngOnDestroy() {
        console.log("background destroy");
        for (let s of this.subscriptions) {
            s.unsubscribe();
        }
    }

    private waitForAuthorizeRequest() {
        let sub = this.chromeapi.OnMessage("authorize").subscribe((message: any) => {
            console.log("got authorization request");
            if (this.vkservice.isAuthorized()) {
                console.log("already authorized");
                window.localStorage.setItem(VKConsts.userDenied, "false");
                if (message.sendResponse) {
                    message.sendResponse();
                }
                return;
            }
            this.vkservice.auth(true).subscribe((session) => {
                console.log("authorized: ", session);
                this.initServices();
                this.createContextMenuItems();
                if (message.sendResponse) {
                    message.sendResponse();
                }
            });
        });
    }

    private initServices() {
        this.lps.init();
        this.userService.init();
        this.dialogsService.init();
    }

    private setActive() {
        this.settings.showTyping.subscribe(value => {
            if (value) {
                this.vkservice.setActive();
            }
        });
    }

    private setOnline() {
        this.settings.setOnline.subscribe(value => {
            console.log("got online options: ", value);
            if (value) {
                this.vkservice.setOnline();
                this.vkservice.getSession().subscribe(session => {
                    this.userService.loadUsers(session.userId.toString());
                });
            }
            else {
                console.log("shadow mode, don't set user online");
            }
        });
    }

    private createContextMenuItems() {
        chrome.contextMenus.removeAll();
        chrome.contextMenus.create(this.getLogOffItem());
        chrome.contextMenus.create(this.getOpenInWindowItem());
    }

    private getLogOffItem() {
        return {
            title: chrome.i18n.getMessage("logOff"),
            contexts: ["browser_action"],
            onclick: () => this.logOff()
        };
    }

    private logOff() {
        console.log("LOG OFF");
        window.localStorage.setItem(VKConsts.userDenied, "true");
        this.vkservice.logoff();
        chrome.contextMenus.removeAll();
    }

    private openSeparateWindow(w, h) {
        console.log("create window");
        chrome.windows.create({
            type: "panel",
            focused: true,
            state: "docked",
            width: w,
            height: h,
            url: "index.html"
        }, (window) => {
            console.dir(window);
            window.alwaysOnTop = true;
        });
    }

    private getOpenInWindowItem() {
        return {
            title: chrome.i18n.getMessage("openInSeparateWindow"),
            contexts: ["browser_action"],
            onclick: () => {
                this.settings.windowSize.first().subscribe(size => {
                    this.openSeparateWindow(size.w, size.h);
                });
            }
        };
    }
}