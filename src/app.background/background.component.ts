import { Component, OnInit, OnDestroy } from "@angular/core";
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import "rxjs/add/Observable/interval";
import "rxjs/add/Observable/timer";
import "rxjs/add/operator/throttleTime";

import { VKConsts } from "../app/vk-consts";
import { SessionInfo } from "./datamodels";

import { AuthHelper } from "./auth-helper";
import { VKService } from "./services";
import { UserService } from "./services";
import { DialogService } from "./services";
import { LPSService } from "./services";
import { ChromeAPIService } from "./services";
import { FileUploadService } from "./services";
import { OptionsService } from "./services";
import { Channels } from "./channels";

@Component({
    selector: "background-app",
    template: "<span>Background component</span>",
})
export class BackgroundComponent implements OnInit, OnDestroy {
    private lastOpenedConversation: any = null;
    private subscriptions: Subscription[] = [];
    private onUnreadCountUpdate: Subscription;

    constructor(
        private http: Http,
        private dialogsService: DialogService,
        private userService: UserService,
        private vkservice: VKService,
        private lps: LPSService,
        private chromeapi: ChromeAPIService,
        private fileUpload: FileUploadService,
        private settings: OptionsService) { }

    ngOnInit() {
        this.chromeapi.AcceptConnections();
        this.chromeapi.init();

        console.log("background init");
        this.vkservice.auth().subscribe(
            (session) => {
                if (!session) {
                    this.chromeapi.UpdateActionBadge("off");
                    chrome.contextMenus.removeAll();
                }
                else {
                    this.initServices();
                    this.createContextMenuItems();
                }
            }
        );

        this.waitForAuthorizeRequest();
        this.subscriptions.push(
            this.chromeapi.OnMessage("last_opened").subscribe((message: any) => {
                if (message.last_opened) {
                    console.log("set last opened");
                    this.lastOpenedConversation = message.last_opened;
                }
                else if (message.go_back) {
                    console.log("go back");
                    this.lastOpenedConversation = null;
                }
                else {
                    console.log("get last opened");
                    message.sendResponse({ last_opened: this.lastOpenedConversation });
                }
                return false;
            })
        );

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

        this.subscriptions.push(
            this.chromeapi.OnMessage(Channels.sendMessageRequest).subscribe((message: any) => {
                this.dialogsService.sendMessage(message.user_id, message.message_body, message.is_chat, message.attachments)
                    .subscribe(messageId => {
                        message.sendResponse({ data: messageId });
                        console.log("message id sent: ", messageId);
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
                this.chromeapi.UpdateActionBadge("");
                this.initServices();
                // sub.unsubscribe();
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
        if (!this.onUnreadCountUpdate) {
            this.onUnreadCountUpdate =
                this.dialogsService.unreadCountUpdate.subscribe(text => {
                    this.chromeapi.UpdateActionBadge(text);
                    this.chromeapi.PostPortMessage({name: "unread_count", data: text});
                });
        }
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
                    this.userService.updateUsers(session.userId.toString());
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
        this.chromeapi.UpdateActionBadge("off");
        this.vkservice.logoff();
        // this.waitForAuthorizeRequest();
        if (this.onUnreadCountUpdate) {
            this.onUnreadCountUpdate.unsubscribe();
            this.onUnreadCountUpdate = null;
        }
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
                let s = this.settings.windowSize.subscribe(size => {
                    this.openSeparateWindow(size.w, size.h);
                    s.unsubscribe();
                });
            }
        };
    }
}