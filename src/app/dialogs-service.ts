import { Injectable } from "@angular/core";
import { Http, Response, RequestOptionsArgs } from "@angular/http";
import { Observable } from "rxjs/Observable";

import { VKService } from "./vk-service";
import { SingleMessageInfo, DialogInfo, DialogsInfo, ChatInfo, DialogShortInfo } from "./datamodels/datamodels";
import { Channels } from "../app.background/channels";
import { ChromeAPIService } from "./chrome-api-service";

@Injectable()
export class DialogService {
    chat_observable: Observable<{ [chatId: number] : ChatInfo }>;
    dialogs_observable: Observable<DialogsInfo>;

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
            name: Channels.mark_as_read_request,
            message_ids: ids
        }).map(x => x.data);
    }

    sendMessage(id: number, message: any, chat: boolean): Observable<number> {
        console.log("sending message", message);
        return this.chromeapi.SendRequest({
            name: Channels.send_message_request,
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
            name: Channels.load_old_dialogs_request
        });
    }

    loadOldMessages(conversation_id): void {
        this.chromeapi.SendMessage({
            name: Channels.load_old_messages_request,
            id: conversation_id
        });
    }

    subscribeOnMessagesCountUpdate(callback: (messagesCount: number) => void): void {
        this.chromeapi.OnPortMessage(Channels.messages_count_update).subscribe((message: any) => {
            console.log("got messages_count_update message");
            callback(message.data);
        });
    }

    initChatsUpdate(): void {
        this.chat_observable = this.chromeapi.subscribeOnMessage(Channels.update_chats).map(x => x.data);
        this.chromeapi.PostPortMessage({
            name: "get_chats"
        });
    }

    initDialogsUpdate(): void {
        this.dialogs_observable = this.chromeapi.subscribeOnMessage("dialogs_update").map(x => x.data);
        this.chromeapi.PostPortMessage({
            name: "get_dialogs"
        });
    }

    getHistory(conversation_id, is_chat): Observable<any> {
        let o = this.chromeapi.subscribeOnMessage("history_update" + conversation_id).map(x => x.data);
        this.chromeapi.SendMessage({
            name: "conversation_id",
            id: conversation_id,
            is_chat: is_chat
        });
        return o;
        // {history:SingleMessageInfo[], count: number}
    }
}