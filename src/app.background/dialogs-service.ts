import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/map";

import { Message, Chat } from "../app/message";
import { Dialog } from "../app/dialog";
import { User } from "../app/user";

import { VKService } from "./vk-service";
import { CacheService } from "./cache-service";
import { UserService } from "./user-service";
import { LPSService } from "./lps-service";
import { ChromeAPIService } from "./chrome-api-service";
import { Channels } from "./channels";

@Injectable()
export class DialogService {
    private get_dialogs: string = "messages.getDialogs";
    private get_history: string = "messages.getHistory";
    private get_chat: string = "messages.getChat";
    private get_message: string = "messages.getById";
    private send_message: string = "messages.send";
    private mark_as_read: string = "messages.markAsRead";

    current_dialog_id: number = null;
    is_chat: boolean = null;

    messages_count: number = 20;
    dialogs_count: number = 20;

    max_dialogs_count: number;

    constructor(
        private vkservice: VKService,
        private cache: CacheService,
        private userService: UserService,
        private lpsService: LPSService,
        private chromeapi: ChromeAPIService) { }

    init() {
        this.lpsService.subscribeOnMessagesUpdate(() => this.updateMessages());
        this.getDialogs().subscribe(dialogs => {
                this.loadDialogUsers(dialogs);
            },
            error => this.handleError(error)
        );

        this.chromeapi.OnMessage(Channels.request_everything).subscribe((message: any) => {
            message.sendResponse({
                dialogs: this.cache.dialogs_cache,
                users: this.cache.users_cache,
                chats: this.cache.chats_cache,
                current_user_id: this.vkservice.getCurrentUserId()
            });
            return false;
        });

        this.chromeapi.OnMessage("get_current_message").subscribe(message => {
            let v = {};
            v[message.key] = "";
            console.log("getting current message: ", v);
            chrome.storage.sync.get(v, (value: any) => {
                console.log("restored message: ", value);
                message.sendResponse(value);
                this.monitorCurrentMessage();
            });
        });

        this.chromeapi.OnMessage("conversation_id").subscribe((message: any) => {
            this.messages_count = 20;
            this.current_dialog_id = message.id;
            this.is_chat = message.is_chat;
            this.postHistoryUpdate();
            this.chromeapi.OnDisconnect().subscribe(() => {
                this.current_dialog_id = null;
                this.is_chat = null;
            });
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
        });

        this.chromeapi.OnMessage(Channels.load_old_messages_request).subscribe((message: any) => {
            this.loadOldMessages();
        });

        this.chromeapi.OnDisconnect().subscribe(() => {
            this.dialogs_count = 20;
        });

        this.chromeapi.OnPortMessage(Channels.load_old_dialogs_request).subscribe(() => {
            this.loadOldDialogs();
        });

        this.chromeapi.OnPortMessage(Channels.get_chats_request).subscribe(() => {
            this.postChatsUpdate();
        });

        this.chromeapi.OnPortMessage(Channels.get_dialogs_request).subscribe(() => {
            this.postDialogsUpdate();
        });
    }

    monitorCurrentMessage() {
        let key = null;
        let current_message = {};

        let save = () => {
            if (key) {
                if (current_message[key]) {
                    chrome.storage.sync.set(current_message);
                }
                else {
                    console.log("remove message: ", current_message);
                    chrome.storage.sync.remove(key);
                }
            }
        };

        let subscription = Observable.interval(10000).subscribe(() => {
            console.log("store current message: ", current_message);
            save();
        });

        this.chromeapi.OnPortMessage("current_message").subscribe(message => {
            key = message.key;
            current_message[key] = message.value;
            if (message.is_last) {
                subscription.unsubscribe();
                save();
            }
        });
    }

    postDialogsUpdate() {
        this.chromeapi.PostPortMessage({
            name: "dialogs_update",
            data: this.cache.dialogs_cache.slice(0, this.dialogs_count)
        });
    }

    postHistoryUpdate() {
        console.log("post history_update message");
        this.chromeapi.PostPortMessage({
            name: "history_update",
            data: this.cache.getHistory(this.current_dialog_id).slice(0, this.messages_count)
        });
    }

    postChatsUpdate() {
        this.chromeapi.PostPortMessage({
            name: Channels.update_chats,
            data: this.cache.chats_cache
        });
    }

    postDialogsCountUpdate() {
        if (this.dialogs_count) {
            console.log("post dialogs_count_update message");
            this.chromeapi.PostPortMessage({
                name: Channels.dialogs_count_update,
                data: this.max_dialogs_count
            });
        }
        else {
            console.log("port dialogs_monitor is closed or max_dialogs_count isn't specified");
        }
    }

    postMessagesCountUpdate() {
        if (this.messages_count) {
            console.log("post messages_count_update message");
            this.chromeapi.PostPortMessage({
                name: Channels.messages_count_update,
                data: this.cache.getMessagesCount(this.current_dialog_id)
            });
        }
        else {
            console.log("max_messages_count isn't specified");
        }
    }

    updateMessages() {
        this.getDialogs().subscribe(dialogs => {
            this.loadDialogUsers(dialogs);
        });

        if (this.current_dialog_id) {
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
        window.setTimeout(() => {
            this.dialogs_count = Math.max(20, this.dialogs_count - 20), 3000 * 60;
        }, 3000 * 60);
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
        return this.vkservice.performAPIRequest(
            this.get_dialogs,
            `count=${count}${from_id ? "&start_message_id=" + from_id : ""}`)
            .map(json => this.toDialog(json));
    }

    getHistory(id: number, chat: boolean, count: number = 20, from_id: number = null): Observable<any> {
        console.log("history is requested. id:" + id + ", chat:" + chat + ", cout:" + count + ", from_id:" + from_id);
        return this.vkservice.performAPIRequest(
            this.get_history,
            `${chat ? "chat_id=" + id : "user_id=" + id}${from_id ? "&start_message_id=" + from_id : ""}&count=${count}&rev=0`);
            /** response: {count: number, items: Message[]} */
    }

    getChatParticipants(chat_id: number): Observable<{}> {
        console.log("chat participants requested");
        return this.vkservice.performAPIRequest(this.get_chat, `chat_ids=${chat_id}&fields=photo_50,online`)
            .map(json => this.toUserDict(json));
    }

    getChats(chat_ids: string): Observable<{}> {
        console.log("chat participants requested");
        return this.vkservice.performAPIRequest(this.get_chat, `chat_ids=${chat_ids}&fields=photo_50,online`)
            .map(json => this.toChatDict(json));
    }

    /** to remove */
    private getMessage(ids: string): Observable<Message[]> {
        console.log("requested message(s) with id: " + ids);
        return this.vkservice.performAPIRequest(this.get_message, `message_ids=${ids}`);
    }

    markAsRead(ids: string): Observable<number> {
        console.log("mark as read message(s) with id: " + ids);
        return this.vkservice.performAPIRequest(this.mark_as_read, `message_ids=${ids}`);
    }

    sendMessage(id: number, message: string, chat: boolean): Observable<Message> {
        console.log("sending message");
        return this.vkservice.performAPIRequest(
            this.send_message,
            `${chat ? "&chat_id=" : "&user_id="}${id}&message=${message}&notification=1`);
    }

    private toChatDict(json): {} {
        let chats = {};
        for (let chat of json) {
            chats[chat.id] = chat;
        }
        return chats;
    }

    private toUserDict(json): {} {
        let users = {};
        for (let user_json of json.users) {
            users[user_json.id] = user_json as User;
        }

        return users;
    }

    private toDialog(json): Dialog[] {
        console.log("dialogs cout " + json.count);
        this.max_dialogs_count = json.count;
        this.postDialogsCountUpdate();
        this.chromeapi.UpdateActionBadge(json.unread_dialogs ? json.unread_dialogs : "");

        return json.items as Dialog[];
    }

    private handleError(error: any) {
        console.error("An error occurred in background-dialog-service: ", error);
        // return Promise.reject(error.message || error);
    }
}