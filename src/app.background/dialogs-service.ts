import { Injectable } from "@angular/core";
import { Http, Response, RequestOptionsArgs, RequestOptions } from "@angular/http";
import { Observable }     from "rxjs/Observable";
import "rxjs/add/operator/concatMap";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/map";

import { VKConsts } from "../app/vk-consts";
import { Message, Chat } from "../app/message";
import { Dialog } from "../app/dialog";
import { User } from "../app/user";

import { VKService } from "./vk-service";
import { ErrorHelper } from "./error-helper";
import { LongPollServer } from "./long-poll-server";
import { LPSHelper } from "./lps-helper";
import { CacheService } from "./cache-service";
import { UserService } from "./user-service";
import { LPSService } from "./lps-service";
import { Channels } from "./channels";

@Injectable()
export class DialogService {
    private get_dialogs: string = "messages.getDialogs";
    private get_history: string = "messages.getHistory";
    private get_chat: string = "messages.getChat";
    private get_message: string = "messages.getById";
    private send_message: string = "messages.send";
    private mark_as_read: string = "messages.markAsRead";
    private get_lps: string = "messages.getLongPollServer";

    update_dialogs_port: chrome.runtime.Port;
    update_history_port: chrome.runtime.Port;
    current_dialog_id: number = null;
    is_chat: boolean = null;

    messages_count: number = 20;
    dialogs_count: number = 20;

    max_dialogs_count: number;

    constructor(
        private vkservice: VKService,
        private http: Http,
        private cache: CacheService,
        private userService: UserService,
        private lpsService: LPSService) {

        this.lpsService.subscribeOnMessagesUpdate(() => this.updateMessages());
        this.getDialogs().subscribe(dialogs => {
                this.loadDialogUsers(dialogs);
            },
            error => this.handleError(error)
        );
        chrome.runtime.onConnect.addListener(port => {
            console.log(port.name + " port opened");
            switch (port.name) {
                case "dialogs_monitor":
                    this.update_dialogs_port = port;
                    this.update_dialogs_port.onDisconnect.addListener(() => {
                        this.update_dialogs_port = null;
                        this.dialogs_count = 20;
                    });
                    this.postDialogsUpdate();
                    this.postDialogsCountUpdate();
                    this.postChatsUpdate();
                    this.update_dialogs_port.onMessage.addListener((message: any) => {
                        if (message.name === Channels.load_old_dialogs_request) {
                            this.loadOldDialogs();
                        }
                        else if (message.name === Channels.get_chats_request) {
                            this.postChatsUpdate();
                        }
                        else if (message.name === Channels.get_dialogs_request) {
                            this.postDialogsUpdate();
                        }
                    });
                    break;
                case "history_monitor":
                    this.update_history_port = port;
                    this.update_history_port.onMessage.addListener((message: any) => {
                        if (message.name === "conversation_id") {
                            this.messages_count = 20;
                            this.current_dialog_id = message.id;
                            this.is_chat = message.is_chat;
                            this.postHistoryUpdate();
                            this.getHistory(this.current_dialog_id, this.is_chat).subscribe(history => {
                                if (history) {
                                    this.cache.pushHistory(history.items, history.count);
                                    this.loadUsersFromMessages(history.items);
                                    this.postHistoryUpdate();
                                    this.postMessagesCountUpdate();
                                }
                                if (this.is_chat) {
                                    this.getChatParticipants(this.current_dialog_id).subscribe(users => {
                                        this.cache.pushUsers(users);
                                        this.userService.postUsersUpdate();
                                    });
                                }
                            },
                            error => this.handleError(error));
                        }
                        else if (message.name === Channels.load_old_messages_request) {
                            this.loadOldMessages();
                        }
                    });
                    this.update_history_port.onDisconnect.addListener(() => {
                        this.update_history_port = null;
                        this.current_dialog_id = null;
                        this.is_chat = null;
                        this.messages_count = 20;
                    });
                    break;
                case Channels.messages_cache_port:
                    let current_message = {};
                    port.onMessage.addListener((value) => {
                        current_message = value;
                    });
                    let subscription = Observable.interval(10000).subscribe(() => {
                        let key = Object.keys(current_message)[0];
                        if (current_message[key]) {
                            chrome.storage.sync.set(current_message);
                        }
                    });
                    port.onDisconnect.addListener(() => {
                        subscription.unsubscribe();
                        let key = Object.keys(current_message)[0];
                        if (current_message[key]) {
                            chrome.storage.sync.set(current_message);
                        }
                    });
                    break;
            }
        });
    }

    postDialogsUpdate() {
        if (this.update_dialogs_port) {
            console.log("post dialogs_update message");
            this.update_dialogs_port.postMessage({name: "dialogs_update", data: this.cache.dialogs_cache.slice(0, this.dialogs_count)});
        }
        else {
            console.log("port dialogs_monitor is closed");
        }
    }

    postHistoryUpdate() {
        if (this.update_history_port && this.current_dialog_id) {
            console.log("post history_update message");
            this.update_history_port.postMessage({name: "history_update", data: this.cache.getHistory(this.current_dialog_id).slice(0, this.messages_count)});
        }
        else {
            console.log("port history_monitor is closed or current_dialog_id isn't specified");
        }
    }

    postChatsUpdate() {
        if (this.update_dialogs_port) {
            console.log("post chats_update message");
            this.update_dialogs_port.postMessage({name: Channels.update_chats, data: this.cache.chats_cache});
        }
        else {
            console.log("port dialogs_monitor is closed");
        }
    }

    postDialogsCountUpdate() {
        if (this.update_dialogs_port && this.dialogs_count) {
            console.log("post dialogs_count_update message");
            this.update_dialogs_port.postMessage({name: Channels.dialogs_count_update, data: this.max_dialogs_count});
        }
        else {
            console.log("port dialogs_monitor is closed or max_dialogs_count isn't specified");
        }
    }

    postMessagesCountUpdate() {
        if (this.update_history_port && this.messages_count) {
            console.log("post messages_count_update message");
            this.update_history_port.postMessage({name: Channels.messages_count_update, data: this.cache.getMessagesCount(this.current_dialog_id)});
        }
        else {
            console.log("port history_monitor is closed or max_messages_count isn't specified");
        }
    }

    updateMessages() {
        this.getDialogs().subscribe(dialogs => {
                this.loadDialogUsers(dialogs);
            });

        if (this.update_history_port && this.current_dialog_id) {
            this.getHistory(this.current_dialog_id, this.is_chat).subscribe(history => {
                    if (!history) return;
                    this.cache.pushHistory(history.items, history.count)
                    this.loadUsersFromMessages(history.items);
                    this.postHistoryUpdate();
                },
                error => this.handleError(error)
            );
        }
    }

    loadDialogUsers(dialogs: Dialog[]) {
        this.cache.pushDialogs(dialogs);
        let users = [];
        let chats = [];
        for (let dialog of this.cache.dialogs_cache) {
            if ((dialog.message as Chat).chat_id) {
                chats.push((dialog.message as Chat).chat_id);
            }
            users.push(dialog.message.user_id);
            if (dialog.message.fwd_messages) {
                for (let fwd of dialog.message.fwd_messages) {
                    users.push(fwd.user_id);
                }
            }
        }
        this.userService.loadUsers(users.join());
        this.loadChats(chats.join());
        this.postDialogsUpdate();
    }

    loadUsersFromMessages(messages: Message[]) {
        let ids: any = messages
                .map(msg => msg.fwd_messages ?
                    [msg.user_id].concat(msg.fwd_messages.map(m => m.user_id)) :
                    [msg.user_id]).concat() as number[][];
        /** deflate */
        ids = [].concat.apply([], ids) as number[];
        /** distinct */
        ids = ids.filter((value, i, self) => self.indexOf(value) === i);
        ids = ids.filter((value, i, self) => this.cache.users_cache[value] ? false : true);
        this.userService.loadUsers(ids.join());
    }

    loadChats(chat_ids: string) {
        this.getChats(chat_ids).subscribe(chats => {
                this.cache.updateChats(chats);
                this.postChatsUpdate();
            },
            error => this.handleError(error),
            () => console.log("chats loaded")
        );
    }

    loadOldDialogs() {
        if (this.dialogs_count >= this.max_dialogs_count) {
            console.log("all dialogs are loaded");
            return;
        }
        console.log("load old dialogs");
        this.dialogs_count += 20;
        window.setTimeout(() => this.dialogs_count -= 20, 3000 * 60);
        if (this.dialogs_count <= this.cache.dialogs_cache.length) {
            this.postDialogsUpdate();
        }

        this.getDialogs(20, this.cache.getLastDialogMessageId()).subscribe(dialogs => {
            this.loadDialogUsers(dialogs);
        },
        error => this.handleError(error),
        () => console.log("old dialogs loaded"));
    }

    loadOldMessages() {
        if (this.messages_count >= this.cache.getMessagesCount(this.current_dialog_id)) {
            console.log("all messages are loaded");
            return;
        }
        console.log("load old messages");
        this.messages_count += 20;
        if (this.cache.getHistory(this.current_dialog_id).length >= this.messages_count) {
            this.postHistoryUpdate();
            return;
        }
        this.getHistory(this.current_dialog_id, this.is_chat, 20, this.cache.getLastMessageId(this.current_dialog_id)).subscribe(history => {
            if (!history) return;
            if (this.cache.pushHistory(history.items as Message[], history.count)) {
                this.loadUsersFromMessages(history.items);
                this.postHistoryUpdate();
            }
        },
        error => this.handleError(error),
        () => console.log("old messages loaded"));
    }

    getDialogs(count: number = 20, from_id: number = null): Observable<Dialog[]> {
        console.log("dialogs are requested");
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_dialogs
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&count=" + count
                + (from_id ? "&start_message_id=" + from_id : "");
            return this.http.get(uri).map(response => this.toDialog(response.json()));
        });
    }

    getHistory(id: number, chat: boolean, count: number = 20, from_id: number = null): Observable<any> {
        console.log("history is requested. id:" + id + ", chat:" + chat + ", cout:" + count + ", from_id:" + from_id);
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_history
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + (chat ? "&chat_id=" + id : "&user_id=" + id)
                + (from_id ? "&start_message_id=" + from_id : "")
                + "&count=" + count
                + "&rev=0";

            return this.http.get(uri).map(response => response.json()).map(json => ErrorHelper.checkErrors(json) ? null : json.response);
            /** response: {count: number, items: Message[]} */
        });
    }

    getChatParticipants(chat_id: number): Observable<{}> {
        console.log("chat participants requested");
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_chat
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&chat_id=" + chat_id
                + "&fields=photo_50,online";

            return this.http.get(uri).map(response => this.toUserDict(response.json()));
        });
    }

    getChats(chat_ids: string): Observable<{}> {
        console.log("chat participants requested");
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_chat
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&chat_ids=" + chat_ids
                + "&fields=photo_50,online";

            return this.http.get(uri).map(response => this.toChatDict(response.json()));
        });
    }

    /** to remove */
    private getMessage(ids: string): Observable<Message[]> {
        console.log("requested message(s) with id: " + ids);
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_message
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&message_ids=" + ids;
            return this.http.get(uri).map(response => response.json()).map(json => ErrorHelper.checkErrors(json) ? null : json.response);
        });
    }

    markAsRead(ids: string): Observable<number> {
        console.log("mark as read message(s) with id: " + ids);
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.mark_as_read
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&message_ids=" + ids;
            return this.http.get(uri).map(response => response.json());
        });
    }

    sendMessage(id: number, message: string, chat: boolean): Observable<Message> {
        console.log("sending message");
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.send_message
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + (chat ? "&chat_id=" : "&user_id=") + id
                + "&message=" + message
                + "&notification=1";
            return this.http.get(uri).map(response => response.json().response);
        });
    }

    private toChatDict(json): {} {
        if (ErrorHelper.checkErrors(json)) return {};
        let chats = {};
        for (let chat of json.response) {
            chats[chat.id] = chat;
        }
        return chats;
    }

    private toUserDict(json): {} {
        if (ErrorHelper.checkErrors(json)) return {};
        let users = {};
        for (let user_json of json.response.users) {
            users[user_json.id] = user_json as User;
        }

        return users;
    }

    private toDialog(json): Dialog[] {
        if (ErrorHelper.checkErrors(json)) return [];
        json = json.response || json;
        console.log("dialogs cout " + json.count);
        this.max_dialogs_count = json.count;
        this.postDialogsCountUpdate();
        this.setBadgeNumber(json.unread_dialogs ? json.unread_dialogs : "");

        return json.items as Dialog[];
    }

    private setBadgeNumber(n: number) {
        chrome.browserAction.setBadgeText({text: String(n)});
    }

    private handleError(error: any) {
        console.error("An error occurred: ", error);
        // return Promise.reject(error.message || error);
    }
}