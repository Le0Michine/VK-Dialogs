import { Injectable } from "@angular/core";
import { Http, Response, RequestOptionsArgs } from "@angular/http";
import { Observable } from "rxjs/Observable";

import { VKService } from "./vk.service";
import { SingleMessageInfo, DialogInfo, DialogsInfo, ChatInfo, DialogShortInfo } from "../datamodels";
import { Channels } from "../../app.background/channels";
import { ChromeAPIService } from "./chrome-api.service";

@Injectable()
export class DialogService {
    chatObservable: Observable<{ [chatId: number]: ChatInfo }>;
    dialogsObservable: Observable<DialogsInfo>;

    private chats;

    constructor(
        private http: Http,
        private vkservice: VKService,
        private chromeapi: ChromeAPIService) { }

    init() {
        console.log("init dialog service");
        this.initChatsUpdate();
        this.initDialogsUpdate();
    }

    markAsRead(ids: string): Observable<number> {
        console.log("requested message(s) with id: " + ids);
        return this.chromeapi.SendRequest({
            name: Channels.markAsReadRequest,
            message_ids: ids
        }).map(x => x.data);
    }

    sendMessage(id: number, message: any, chat: boolean): Observable<number> {
        console.log("sending message", message);
        return this.chromeapi.SendRequest({
            name: Channels.sendMessageRequest,
            user_id: id,
            message_body: message.body,
            attachments: message.attachments,
            is_chat: chat
        }).map(x => x.data);
    }

    searchDialog(searchTerm: string): Observable<DialogShortInfo[]> {
        return this.chromeapi.SendRequest({ name: "search_dialog", data: searchTerm}).map(x => x.data);
    }

    loadOldDialogs(): void {
        this.chromeapi.PostPortMessage({
            name: Channels.loadOldDialogsRequest
        });
    }

    loadOldMessages(conversationId): void {
        this.chromeapi.SendMessage({
            name: Channels.loadOldMessagesRequest,
            id: conversationId
        });
    }

    subscribeOnMessagesCountUpdate(callback: (messagesCount: number) => void): void {
        this.chromeapi.OnPortMessage(Channels.messagesCountUpdate).subscribe((message: any) => {
            console.log("got messages_count_update message");
            callback(message.data);
        });
    }

    initChatsUpdate(): void {
        this.chatObservable = this.chromeapi.subscribeOnMessage(Channels.updateChats).map(x => x.data);
        this.chromeapi.PostPortMessage({
            name: "get_chats"
        });
    }

    initDialogsUpdate(): void {
        this.dialogsObservable = this.chromeapi.subscribeOnMessage("dialogs_update").map(x => x.data);
        this.chromeapi.PostPortMessage({
            name: "get_dialogs"
        });
    }

    getHistory(conversationId, isChat): Observable<any> {
        let o = this.chromeapi.subscribeOnMessage("history_update" + conversationId).map(x => x.data);
        this.chromeapi.SendMessage({
            name: "conversation_id",
            id: conversationId,
            is_chat: isChat
        });
        return o;
        // {history:SingleMessageInfo[], count: number}
    }
}