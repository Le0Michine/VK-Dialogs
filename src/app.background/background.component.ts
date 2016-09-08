import { Component, OnInit, OnDestroy } from "@angular/core";
import { Http } from "@angular/http";
import { Observable } from "rxjs/Observable";
import "rxjs/add/Observable/interval";

import { VKConsts } from "../app/vk-consts";
import { SessionInfo } from "../app/session-info";

import { AuthHelper } from "./auth-helper";
import { VKService } from "./vk-service";
import { UserService } from "./user-service";
import { DialogService } from "./dialogs-service";
import { Channels } from "./channels";

@Component({
    selector: "background-app",
    template: "<span>Background component</span>",
})
export class BackgroundComponent implements OnInit, OnDestroy {
    i: number = 0;
    last_opened_conversation: any = null;

    constructor(
        private http: Http,
        private dialogsService: DialogService,
        private userService: UserService,
        private vkservice: VKService) { }

    ngOnInit() {
        console.log("background init");
        this.preAuthorize();

        chrome.contextMenus.removeAll();
        chrome.contextMenus.create({
            title: "Log Off",
            contexts: ["browser_action"],
            onclick: () => {
                console.log("LOG OFF");
                window.localStorage.setItem(VKConsts.user_denied, "true");
                this.vkservice.logoff();
            }
        });
        chrome.contextMenus.create({
            title: "Open in separate window",
            contexts: ["browser_action"],
            onclick: () => {
                console.log("create window");
                chrome.windows.create({
                    type: "panel",
                    focused: true,
                    state: "docked",
                    width: 550,
                    height: 500,
                    url: "index.html"
                }, (window) => {
                    console.dir(window);
                    window.alwaysOnTop = true;
                });
            }
        });

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.name) {
                case "set_online":
                    this.setOnline();
                    return false;
                case "last_opened":
                    if (request.last_opened) {
                        console.log("set last opened");
                        this.last_opened_conversation = request.last_opened;
                    }
                    else if (request.go_back) {
                        console.log("go back");
                        this.last_opened_conversation = null;
                    }
                    else {
                        console.log("get last opened");
                        sendResponse({ last_opened: this.last_opened_conversation });
                    }
                    return false;
                case Channels.get_dialogs_request:
                    this.dialogsService.getDialogs().subscribe(dialogs => {
                        sendResponse({data: dialogs});
                        console.log("dialogs sent");
                    });
                    return true;
                case Channels.get_history_request:
                    this.dialogsService.getHistory(request.conversation_id, request.is_chat).subscribe(history => {
                        sendResponse({data: history});
                        console.log("history sent");
                    });
                    return true;
                case Channels.get_chat_participants_request:
                    this.dialogsService.getChatParticipants(request.chat_id).subscribe(participants => {
                        sendResponse({data: participants});
                        console.log("chat participants sent");
                    });
                    return true;
                case Channels.mark_as_read_request:
                    this.dialogsService.markAsRead(request.message_ids).subscribe(response => {
                        sendResponse({data: response});
                        console.log("mark as read result: " + JSON.stringify(response));
                    });
                    return true;
                case Channels.send_message_request:
                    this.dialogsService.sendMessage(request.user_id, request.message_body, request.is_chat).subscribe(message => {
                        sendResponse({data: message});
                        console.log("message id sent: ", message);
                    });
                    return true;
                case Channels.get_multiple_users_request:
                    this.userService.getUsers(request.user_ids).subscribe(users => {
                        sendResponse({data: users});
                        console.log("users sent");
                    });
                    return true;
                case Channels.get_user_request:
                    this.userService.getUser(request.user_id).subscribe(user => {
                        sendResponse({data: user});
                        console.log("single user sent: " + JSON.stringify(user));
                    });
                    return true;
                case Channels.get_session_request:
                    let obs: Observable<SessionInfo>;
                    if (request.force_auth) {
                        console.log("got request about implicit authorization");
                        obs = AuthHelper.authorize(true, request.requested_by_user);
                    }
                    else {
                        console.log("got request about explicit authorization");
                        obs = AuthHelper.authorize(false, request.requested_by_user);
                    }
                    obs.subscribe(session => {
                            if (request.requested_by_user || request.force_auth) return;
                            sendResponse({data: session});
                        },
                        error => console.log(error)
                    );
                    return true;
                case "request_error":
                    this.processError(request.error_code);
                    return true;
            }
        });
    }

    processError(erorr_code: number) {

    }

    ngOnDestroy() {
        console.log("background destroy");
    }

    private preAuthorize() {
        if (!window.localStorage.getItem(VKConsts.vk_access_token_id) || !window.localStorage.getItem(VKConsts.vk_auth_timestamp_id)) {
            console.log("unable to find auth session data");
            this.vkservice.auth(false);
        }
        else if ((Math.floor(Date.now() / 1000) - Number(window.localStorage.getItem(VKConsts.vk_auth_timestamp_id))) > 86400) {
            console.log("session expired, reauthorize");
            this.vkservice.auth(true);
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
}