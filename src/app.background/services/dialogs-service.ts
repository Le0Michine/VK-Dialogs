import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs/Observable";
import { Observer } from "rxjs/Observer";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/map";
import "rxjs/add/operator/distinct";
import "rxjs/add/operator/filter";

import { UserInfo, SingleMessageInfo, ChatInfo, HistoryInfo, DialogInfo, DialogListInfo } from "../datamodels";
import { DialogShortInfo, HistoryListInfo } from "../datamodels";
import { VKService } from "./vk-service";
import { UserService } from "./user-service";
import { LPSService } from "./lps-service";
import { ChromeAPIService } from "./chrome-api-service";
import { Channels } from "../channels";
import { UsersActions, HistoryActions, DialogListActions, ChatsActions, AppBackgroundStore } from "../app-background.store";

@Injectable()
export class DialogService {
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
        private store: Store<AppBackgroundStore>,
        private vkservice: VKService,
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
        this.chromeapi.onUnsubscribe
            .filter((sub: any) => sub.name.includes("history_update"))
            .subscribe((sub: any) => {
                console.log("unsubscribe from history_update: ", sub);
                let i = this.openedConversations.findIndex(x => "history_update_" + x.conversation_id === sub.name);
                if (i > -1) {
                    this.openedConversations.splice(i, 1);
                }
        });

        this.lpsService.messageUpdate.subscribe(() => this.updateMessages());
        this.lpsService.resetHistory.subscribe(() => {
            console.log("reset history");
            this.updateMessages();
        });

        this.getDialogs();

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

        this.chromeapi.onSubscribe.filter((s: string) => /^history_update_.+$/.test(s)).subscribe((s: string) => {
            console.log("subscribe on history update", s);
            let parts = s.split("_");
            let id = +parts[parts.length - 2];
            let isChat = parts[parts.length - 1] === "true" ? true : false;
            let openedConversation = {
                messages_count: 20,
                conversation_id: id,
                is_chat: isChat
            };
            if (this.openedConversations.findIndex(x => x.conversation_id === openedConversation.conversation_id) < 0) {
                this.openedConversations.push(openedConversation);
            }

            this.getHistory(openedConversation.conversation_id, openedConversation.is_chat).subscribe(history => {
                if (history) {
                    this.store.dispatch({ type: HistoryActions.HISTORY_UPDATED, payload: history });
                    this.loadUsersFromMessages(history.messages);
                }
                if (openedConversation.is_chat) {
                    this.getChatParticipants(openedConversation.conversation_id);
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
            .distinct(x => x[key])
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

    updateMessages(): void {
        console.log("update messages");
        this.getDialogs();

        for (let conv of this.openedConversations) {
            this.getHistory(conv.conversation_id, conv.is_chat).subscribe(history => {
                    if (!history){
                        return;
                    }
                    this.store.dispatch({ type: HistoryActions.HISTORY_UPDATED, payload: history });
                    this.loadUsersFromMessages(history.messages);
                },
                error => this.handleError(error)
            );
        }
    }

    loadDialogUsers(dialogs: DialogListInfo): void {
        this.store.select(s => s.dialogs).first().subscribe((ds: DialogListInfo) => {
            let users = [];
            for (let dialog of ds.dialogs) {
                users.push(dialog.message.userId, dialog.message.fromId);
                if (dialog.message.fwdMessages) {
                    users.push(...dialog.message.fwdMessages.map(fwd => fwd.userId));
                }
            }
            this.userService.loadUsers(users.join());
            let chats = ds.dialogs.filter(d => d.message.chatId ? true : false).map(c => c.message.chatId);
            this.getChats(chats.join());
        });
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
        this.store.select(s => s.users).subscribe(users => {
            ids = ids.filter((value, i, self) => users.userIds.indexOf(value) === -1);
            this.userService.loadUsers(ids.join());
        });
    }


    getDialogs(count: number = 20, fromId: number = null): void {
        console.log("dialogs are requested");
        this.vkservice.performAPIRequest(
            this.getDialogsApiMethod,
            `count=${count}${fromId ? "&start_message_id=" + fromId : ""}`)
            .map(json => this.toDialogsInfo(json))
            .subscribe(dialogList => {
                this.store.dispatch({ type: DialogListActions.DIALOGS_UPDATED, payload: dialogList });
                this.loadDialogUsers(dialogList);
            });
    }

    getHistory(id: number, chat: boolean, count: number = 20, fromId: number = null): Observable<HistoryInfo> {
        console.log("history is requested. id:" + id + ", chat:" + chat + ", cout:" + count + ", from_id:" + fromId);
        return this.vkservice.performAPIRequest(
            this.getHistoryApiMethod,
            `${chat ? "chat_id=" + id : "user_id=" + id}${fromId ? "&start_message_id=" + fromId : ""}&count=${count}&rev=0`)
            .map(json => this.toHistoryViewModel(json));
    }

    getChatParticipants(chatId: number): void {
        console.log("chat participants requested");
        this.vkservice.performAPIRequest(this.getChatApiMethod, `chat_ids=${chatId}&fields=photo_50,online`)
            .map(json => this.userService.toUsersList(json))
            .subscribe(users => this.store.dispatch({ type: UsersActions.USERS_UPDATED, payload: users }));
    }

    getChats(chatIds: string): void {
        console.log("chats requested", chatIds);
        this.vkservice.performAPIRequest(this.getChatApiMethod, `chat_ids=${chatIds}&fields=photo_50,online`)
            .map(json => this.toChatList(json))
            .subscribe(chats => this.store.dispatch({ type: ChatsActions.CHATS_UPDATED, payload: chats }));
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

    private loadOldDialogs(): void{
        if (this.dialogsCount >= this.maxDialogsCount) {
            console.log("all dialogs are loaded");
            return;
        }
        console.log("load old dialogs");

        this.store.select(s => s.dialogs).first().subscribe((dialogList: DialogListInfo) => {
            let lastDialogId = dialogList.dialogs[dialogList.dialogs.length - 1].message.id;
            this.getDialogs(20, lastDialogId);
        });
    }

    private loadOldMessages(conversation): void {
        console.log("load old messages");
        this.store.select(s => s.history).first().subscribe((historyList: HistoryListInfo) => {
            let messages = historyList.history[conversation.conversation_id].messages;
            this.getHistory(conversation.conversation_id, conversation.is_chat, 20, messages[messages.length - 1].id)
                .subscribe(history => {
                    if (!history){
                        return;
                    }
                    this.store.dispatch({ type: HistoryActions.HISTORY_UPDATED, payload: history });
                    this.loadUsersFromMessages(history.messages);
                },
                error => this.handleError(error),
                () => console.log("old messages loaded")
            );
        });
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

    private toChatList(json): ChatInfo[] {
        return json.map(jsonChat => this.toChatViewModel(jsonChat));
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
        return message;
    }

    private toDialogViewModel(json): DialogInfo {
        let dialog = new DialogInfo();
        dialog.unreadCount = json.unread;
        dialog.message = this.toSingleMessageViewModel(json.message);
        return dialog;
    }

    private toDialogsInfo(json): DialogListInfo {
        let dialogs = new DialogListInfo();
        dialogs.dialogs = json.items.map(x => this.toDialogViewModel(x));
        dialogs.count = json.count;
        dialogs.unread = json.unread_dialogs;

        return dialogs;
    }

    private handleError(error: any): void {
        console.error("An error occurred in background-dialog-service: ", error);
    }
}