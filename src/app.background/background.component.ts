import { Component, OnInit, OnDestroy } from "@angular/core";
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import "rxjs/add/Observable/interval";
import "rxjs/add/Observable/timer";
import "rxjs/add/operator/throttleTime";

import { VKConsts } from "../app/vk-consts";
import { SessionInfo } from "../app/session-info";

import { AuthHelper } from "./auth-helper";
import { VKService } from "./vk-service";
import { UserService } from "./user-service";
import { DialogService } from "./dialogs-service";
import { LPSService } from "./lps-service";
import { ChromeAPIService } from "./chrome-api-service";
import { Channels } from "./channels";

@Component({
    selector: "background-app",
    template: "<span>Background component</span>",
})
export class BackgroundComponent implements OnInit, OnDestroy {
    private last_opened_conversation: any = null;
    private subscriptions: Subscription[] = [];
    private onUnreadCountUpdate: Subscription;

    constructor(
        private http: Http,
        private dialogsService: DialogService,
        private userService: UserService,
        private vkservice: VKService,
        private lps: LPSService,
        private chromeapi: ChromeAPIService) { }

    ngOnInit() {
        this.chromeapi.AcceptConnections();
        this.chromeapi.init();
        // Observable.interval(30 * 1000).subscribe((i) => console.warn("I'M ALIVE!!! ", i, new Date(Date.now())));

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
                    this.last_opened_conversation = message.last_opened;
                }
                else if (message.go_back) {
                    console.log("go back");
                    this.last_opened_conversation = null;
                }
                else {
                    console.log("get last opened");
                    message.sendResponse({ last_opened: this.last_opened_conversation });
                }
                return false;
            })
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
            this.chromeapi.OnMessage(Channels.mark_as_read_request).subscribe((message: any) => {
                this.dialogsService.markAsRead(message.message_ids).subscribe(response => {
                    message.sendResponse({data: response});
                    console.log("mark as read result: ", response);
                });
                return true;
            })
        );

        this.subscriptions.push(
            this.chromeapi.OnMessage(Channels.send_message_request).subscribe((message: any) => {
                this.dialogsService.sendMessage(message.user_id, message.message_body, message.is_chat).subscribe(message_id => {
                    message.sendResponse({ data: message_id });
                    console.log("message id sent: ", message_id);
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
            if (this.vkservice.isAuthorized()) {
                console.log("already authorized");
                if (message.sendResponse) {
                    message.sendResponse();
                }
                return;
            }
            this.vkservice.auth(true).subscribe((session) => {
                console.log("authorized: ", session);
                this.chromeapi.UpdateActionBadge("");
                this.initServices();
                sub.unsubscribe();
                this.createContextMenuItems();
                if (message.sendResponse) {
                    message.sendResponse();
                }
            });
        })
    }

    private initServices() {
        this.lps.init();
        this.userService.init();
        this.dialogsService.init();
        if (!this.onUnreadCountUpdate) {
            this.onUnreadCountUpdate =
                this.dialogsService.unreadCountUpdate.subscribe(text => this.chromeapi.UpdateActionBadge(text));
        }
    }

    private setOnline() {
        chrome.storage.sync.get({"setOnline": true}, (value: any) => {
            console.log("got online options: ", value);
            if (value.setOnline) {
                this.vkservice.setOnline();
                this.vkservice.getSession().subscribe(session => {
                    this.userService.updateUsers(session.user_id);
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
            onclick: () => {
                console.log("LOG OFF");
                window.localStorage.setItem(VKConsts.user_denied, "true");
                this.chromeapi.UpdateActionBadge("off");
                this.vkservice.logoff();
                //this.waitForAuthorizeRequest();
                if (this.onUnreadCountUpdate) {
                    this.onUnreadCountUpdate.unsubscribe();
                    this.onUnreadCountUpdate = null;
                }
                chrome.contextMenus.removeAll();
            }
        }
    }

    private getOpenInWindowItem() {
        return {
            title: chrome.i18n.getMessage("openInSeparateWindow"),
            contexts: ["browser_action"],
            onclick: () => {
                console.log("create window");
                chrome.windows.create({
                    type: "panel",
                    focused: true,
                    state: "docked",
                    width: 550,
                    height: 600,
                    url: "index.html"
                }, (window) => {
                    console.dir(window);
                    window.alwaysOnTop = true;
                });
            }
        }
    }
}