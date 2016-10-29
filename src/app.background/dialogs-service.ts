import { Injectable, EventEmitter } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/map";
import "rxjs/add/operator/distinct";
import "rxjs/add/operator/filter";

import { UserInfo, SingleMessageInfo, ChatInfo, HistoryInfo, DialogInfo, DialogsInfo } from "./datamodels/datamodels";
import { DialogShortInfo } from "./datamodels";
import { VKService } from "./vk-service";
import { CacheService } from "./cache-service";
import { UserService } from "./user-service";
import { LPSService } from "./lps-service";
import { ChromeAPIService } from "./chrome-api-service";
import { Channels } from "./channels";

@Injectable()
export class DialogService {
    unreadCountUpdate: EventEmitter<string> = new EventEmitter();
    onUpdate: EventEmitter<{}> = new EventEmitter();

    private getDialogsApiMethod: string = "messages.getDialogs";
    private getHistoryApiMethod: string = "messages.getHistory";
    private getChatApiMethod: string = "messages.getChat";
    private getMessageApiMethod: string = "messages.getById";
    private sendMessageApiMethod: string = "messages.send";
    private markAsReadApiMethod: string = "messages.markAsRead";
    private searchDialogsApiMethod: string = "messages.searchDialogs";

    private openedConversations: any[] = [];
    private initialized = false;

    private dialogsCount: number = 20;

    private maxDialogsCount: number;

    constructor(
        private vkservice: VKService,
        private cache: CacheService,
        private userService: UserService,
        private lpsService: LPSService,
        private chromeapi: ChromeAPIService
    ) { }

    init(): void {
        if (this.initialized) {
            console.warn("dialog service already initialized");
            return;
        }
        this.initialized = true;
        this.chromeapi.registerObservable(this.onUpdate);
        this.chromeapi.onUnsubscribe
            .filter((sub: any) => sub.name.includes("history_update"))
            .subscribe((sub: any) => {
                console.log("unsubscribe from history_update: ", sub);
                let i = this.openedConversations.findIndex(x => "history_update" + x.conversation_id === sub.name);
                if (i > -1) {
                    this.openedConversations.splice(i, 1);
                }
        });

        this.lpsService.messageUpdate.subscribe(() => this.updateMessages());
        this.lpsService.resetHistory.subscribe(() => {
            console.log("reset history");
            this.updateMessages();
        });

        this.getDialogs().subscribe(dialogs => {
                this.loadDialogUsers(dialogs);
            },
            error => this.handleError(error)
        );

        this.chromeapi.OnMessage(Channels.requestEverything).subscribe((message: any) => {
            message.sendResponse({
                dialogs: this.cache.dialogsCache,
                users: this.cache.usersCache,
                chats: this.cache.chatsCache,
                current_user_id: this.vkservice.getCurrentUserId()
            });
            return false;
        });

        this.chromeapi.OnPortMessage("get_dialogs").subscribe(() => {
            this.postDialogsUpdate();
        });

        this.chromeapi.OnPortMessage("get_chats").subscribe(() => {
            this.postChatsUpdate();
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
            let openedConversation = {
                messages_count: 20,
                conversation_id: message.id,
                is_chat: message.is_chat
            };
            if (this.openedConversations.findIndex(x => x.conversation_id === openedConversation.conversation_id) < 0) {
                this.openedConversations.push(openedConversation);
            }

            this.postHistoryUpdate();

            this.getHistory(openedConversation.conversation_id, openedConversation.is_chat).subscribe(history => {
                if (history) {
                    this.cache.pushHistory(history);
                    this.loadUsersFromMessages(history.messages);
                    this.postHistoryUpdate();
                }
                if (openedConversation.is_chat) {
                    this.getChatParticipants(openedConversation.conversation_id).subscribe(users => {
                        this.cache.pushUsers(users);
                        this.userService.postUsersUpdate();
                    });
                }
            },
            error => this.handleError(error));
        });

        this.chromeapi.OnMessage(Channels.loadOldMessagesRequest).subscribe((message: any) => {
            let conversation = this.openedConversations.find(c => c.conversation_id === message.id);
            console.log("load old messages for: ", conversation);
            this.loadOldMessages(conversation);
        });

        this.chromeapi.OnDisconnect().subscribe(() => {
            this.dialogsCount = 20;
        });

        this.chromeapi.OnPortMessage(Channels.loadOldDialogsRequest).subscribe(() => {
            this.loadOldDialogs();
        });

        this.chromeapi.OnMessage("search_dialog").subscribe((message) => {
            this.searchDialogs(message.data).subscribe(result => {
                console.log("got search result", result);
                message.sendResponse({ data: result });
            });
            return true;
        });
    }

    monitorCurrentMessage(): void {
        let key = null;
        let currentMessage = {};

        let save = () => {
            if (key) {
                if (currentMessage[key].text || currentMessage[key].attachments) {
                    console.log("update message: ", currentMessage);
                    chrome.storage.sync.set(currentMessage);
                }
                else {
                    console.log("remove message: ", currentMessage);
                    chrome.storage.sync.remove(key);
                }
            }
        };

        let subscription = Observable.interval(10000)
            .map(x => currentMessage)
            .distinct((x, y) => x[key] === y[key])
            .subscribe(() => {
                console.log("store current message: ", currentMessage);
                save();
        });

        let sub = this.chromeapi.OnPortMessage("current_message").subscribe(message => {
            key = message.key;
            currentMessage[key] = {};
            currentMessage[key].text = message.text;
            currentMessage[key].attachments = message.attachments;
            if (message.is_last) {
                console.log("last message, unsubscribe");
                subscription.unsubscribe();
                save();
                sub.unsubscribe();
            }
        });

        let onDisconnect = this.chromeapi.OnDisconnect().subscribe(() => {
            console.log("port disconnected, unsubscribe current_message");
            onDisconnect.unsubscribe();
            sub.unsubscribe();
            subscription.unsubscribe();
            save();
        });
    }

    postDialogsUpdate(): void {
        if (this.cache.dialogsCache.dialogs.length === 0) {
            console.log("no dialogs, nothing to post");
            return;
        }
        let dialogs = new DialogsInfo();
        dialogs.dialogs = this.cache.dialogsCache.dialogs.slice(0, this.dialogsCount);
        dialogs.count = this.cache.dialogsCache.count;
        this.onUpdate.next({
            name: "dialogs_update",
            data: dialogs
        });
    }

    postHistoryUpdate(): void {
        console.log("post history_update message", this.openedConversations);
        for (let h of this.openedConversations) {
            this.postSingleConversationHistoryUpdate(h);
        }
    }

    postSingleConversationHistoryUpdate(conversation): void {
        if (!this.cache.getHistory(conversation.conversation_id).count) {
            console.log(`no history for ${conversation.conversation_id}, nothing to post`);
            return;
        }
        this.onUpdate.next({
            name: "history_update" + conversation.conversation_id,
            data: this.cache.getHistory(conversation.conversation_id, conversation.messages_count)
        });
    }

    postChatsUpdate(): void {
        if (Object.keys(this.cache.chatsCache).length === 0) {
            console.log("no chats, nothing to post");
            return;
        }
        this.onUpdate.next({
            name: Channels.updateChats,
            data: this.cache.chatsCache
        });
    }

    updateMessages(): void {
        console.log("update messages");
        this.getDialogs().subscribe(dialogs => {
            this.loadDialogUsers(dialogs);
        });

        for (let conv of this.openedConversations) {
            this.getHistory(conv.conversation_id, conv.is_chat).subscribe(history => {
                    if (!history) return;
                    this.cache.pushHistory(history);
                    this.loadUsersFromMessages(history.messages);
                    this.postSingleConversationHistoryUpdate(conv);
                },
                error => this.handleError(error)
            );
        }
    }

    loadDialogUsers(dialogs: DialogsInfo): void {
        this.cache.pushDialogs(dialogs);
        let users = [];
        let chats = [];
        for (let dialog of this.cache.dialogsCache.dialogs) {
            if (dialog.message.chatId) {
                chats.push(dialog.message.chatId);
            }
            users.push(dialog.message.userId);
            users.push(dialog.message.fromId);
            if (dialog.message.fwdMessages) {
                for (let fwd of dialog.message.fwdMessages) {
                    users.push(fwd.userId);
                }
            }
        }
        this.userService.loadUsers(users.join());
        this.loadChats(chats.join());
        this.postDialogsUpdate();
    }

    loadUsersFromMessages(messages: SingleMessageInfo[]): void {
        let ids: any = messages
                .map(msg => msg.fwdMessages ?
                    [msg.userId].concat(msg.fwdMessages.map(m => m.userId)) :
                    [msg.userId]).concat() as number[][];
        /** deflate */
        ids = [].concat.apply([], ids) as number[];
        /** distinct */
        ids = ids.filter((value, i, self) => self.indexOf(value) === i);
        ids = ids.filter((value, i, self) => this.cache.usersCache[value] ? false : true);
        this.userService.loadUsers(ids.join());
    }


    getDialogs(count: number = 20, fromId: number = null): Observable<DialogsInfo> {
        console.log("dialogs are requested");
        return this.vkservice.performAPIRequest(
            this.getDialogsApiMethod,
            `count=${count}${fromId ? "&start_message_id=" + fromId : ""}`)
            .map(json => this.toDialogsInfo(json));
    }

    getHistory(id: number, chat: boolean, count: number = 20, fromId: number = null): Observable<HistoryInfo> {
        console.log("history is requested. id:" + id + ", chat:" + chat + ", cout:" + count + ", from_id:" + fromId);
        return this.vkservice.performAPIRequest(
            this.getHistoryApiMethod,
            `${chat ? "chat_id=" + id : "user_id=" + id}${fromId ? "&start_message_id=" + fromId : ""}&count=${count}&rev=0`)
            .map(json => this.toHistoryViewModel(json));
    }

    getChatParticipants(chatId: number): Observable<{ [id: number]: UserInfo }> {
        console.log("chat participants requested");
        return this.vkservice.performAPIRequest(this.getChatApiMethod, `chat_ids=${chatId}&fields=photo_50,online`)
            .map(json => this.userService.toUsersDictionary(json));
    }

    getChats(chatIds: string): Observable<{ [id: number]: ChatInfo }> {
        console.log("chats requested");
        return this.vkservice.performAPIRequest(this.getChatApiMethod, `chat_ids=${chatIds}&fields=photo_50,online`)
            .map(json => this.toChatDict(json));
    }

    markAsRead(ids: string): Observable<number> {
        console.log("mark as read message(s) with id: " + ids);
        return this.vkservice.performAPIRequest(this.markAsReadApiMethod, `message_ids=${ids}`);
    }

    sendMessage(id: number, message: string, chat: boolean, attachments: string): Observable<number> {
        console.log("sending message");
        return this.vkservice.performAPIRequest(
            this.sendMessageApiMethod,
            `${chat ? "&chat_id=" : "&user_id="}${id}&message=${message}&notification=1&attachment=${attachments}`);
    }

    searchDialogs(searchTerm: string): Observable<DialogShortInfo[]> {
        console.log("search dialogs", searchTerm);
        return this.vkservice.performAPIRequest(
            this.searchDialogsApiMethod,
            `&q=${searchTerm}&limit=10`
        ).map(r => this.toDialogsShort(r));
    }

    private loadChats(chatIds: string): void {
        this.getChats(chatIds).subscribe(chats => {
                this.cache.updateChats(chats);
                this.postChatsUpdate();
            },
            error => this.handleError(error),
            () => console.log("chats loaded")
        );
    }

    private loadOldDialogs(): void{
        if (this.dialogsCount >= this.maxDialogsCount) {
            console.log("all dialogs are loaded");
            return;
        }
        console.log("load old dialogs");
        this.dialogsCount += 20;
        window.setTimeout(() => {
            this.dialogsCount = Math.max(20, this.dialogsCount - 20);
        }, 3000 * 60);
        if (this.dialogsCount <= this.cache.dialogsCache.dialogs.length) {
            this.postDialogsUpdate();
        }

        this.getDialogs(20, this.cache.getLastDialogMessageId()).subscribe(dialogs => {
            this.loadDialogUsers(dialogs);
        },
        error => this.handleError(error),
        () => console.log("old dialogs loaded"));
    }

    private loadOldMessages(conversation): void {
        let h = this.cache.getHistory(conversation.conversation_id);
        if (h.messages.length >= h.count) {
            console.log("all messages are loaded");
            return;
        }
        console.log("load old messages");
        conversation.messages_count += 20;
        if (h.messages.length >= conversation.messages_count) {
            this.postSingleConversationHistoryUpdate(conversation);
            return;
        }
        this.getHistory(conversation.conversation_id, conversation.is_chat, 20, this.cache.getLastMessageId(conversation.conversation_id)).subscribe(history => {
            if (!history) return;
            if (this.cache.pushHistory(history)) {
                this.loadUsersFromMessages(history.messages);
                this.postSingleConversationHistoryUpdate(conversation);
            }
        },
        error => this.handleError(error),
        () => console.log("old messages loaded"));
    }

    private toDialogsShort(json): DialogShortInfo[] {
        let dialogs: DialogShortInfo[] = [];
        for (let x of json) {
            let dialog = new DialogShortInfo();
            dialog.id = x.id;
            dialog.title = x.title || x.first_name + " " + x.last_name;
            dialog.type = x.type;
            dialogs.push(dialog);
        }
        return dialogs;
    }

    private toChatDict(json): { [id: number]: ChatInfo } {
        let chats: { [id: number]: ChatInfo } = {};
        for (let jsonChat of json) {
            chats[jsonChat.id] = this.toChatViewModel(jsonChat);
        }
        return chats;
    }

    private toHistoryViewModel(json): HistoryInfo {
        let history = new HistoryInfo();
        history.count = json.count;
        history.messages = json.items.map(x => this.toSingleMessageViewModel(x));
        history.conversationId = history.messages.length ? history.messages[0].conversationId : 0;
        history.isChat = history.messages.length && history.messages[0].chatId ? true : false;
        history.conversationTitle = history.messages.length ? history.messages[0].title : "";
        return history;
    }

    private toChatViewModel(json): ChatInfo {
        let chat = new ChatInfo();
        chat.adminId = json.admin_id;
        chat.id = json.id;
        chat.title = json.title;
        chat.users = json.users.map(u => this.userService.toUserViewModel(u));
        chat.type = json.type;
        return chat;
    }

    private toSingleMessageViewModel(json): SingleMessageInfo {
        let message = new SingleMessageInfo();
        message.action = json.action;
        message.actionMid = json.action_mid;
        message.attachments = json.attachments;
        message.body = json.body;
        message.userId = json.user_id;
        message.chatId = json.chat_id;
        message.date = json.date;
        message.fromId = json.from_id || (json.out ? this.vkservice.getCurrentUserId() : json.user_id);
        message.fwdMessages = json.fwd_messages ? json.fwd_messages.map(x => this.toSingleMessageViewModel(x)) : null;
        message.id = json.id;
        message.isRead = json.read_state;
        message.out = json.out;
        message.photo50 = json.photo_50;
        message.title = json.title;
        message.conversationId = message.chatId || message.userId;
        // console.info(json, message);
        return message;
    }

    private toDialogViewModel(json): DialogInfo {
        let dialog = new DialogInfo();
        dialog.unreadCount = json.unread;
        dialog.message = this.toSingleMessageViewModel(json.message);
        return dialog;
    }

    private toDialogsInfo(json): DialogsInfo {
        console.log("dialogs cout " + json.count);
        this.maxDialogsCount = json.count;
        this.unreadCountUpdate.emit(json.unread_dialogs ? json.unread_dialogs : "");

        let dialogs = new DialogsInfo();
        dialogs.dialogs = json.items.map(x => this.toDialogViewModel(x));
        dialogs.count = json.count;

        return dialogs;
    }

    private handleError(error: any): void {
        console.error("An error occurred in background-dialog-service: ", error);
    }
}