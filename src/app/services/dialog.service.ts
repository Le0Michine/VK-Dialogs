import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Store } from "@ngrx/store";

import { VKService } from "./vk.service";
import { SingleMessageInfo, DialogInfo, DialogListInfo, ChatInfo, DialogShortInfo, HistoryInfo, InputMessageInfo } from "../datamodels";
import { Channels } from "../../app.background/channels";
import { ChromeAPIService } from "./chrome-api.service";
import { AppState, HistoryActions } from "../app.store";
import { typeMessage } from "../actions";

@Injectable()
export class DialogService {
    constructor(
        private vkservice: VKService,
        private chromeapi: ChromeAPIService,
        private store: Store<AppState>
    ) { }

    init() {
        console.log("init dialog service");
    }

    markAsRead(ids: string): Observable<number> {
        console.log("requested message(s) with id: " + ids);
        return this.chromeapi.SendRequest({
            name: Channels.markAsReadRequest,
            message_ids: ids
        }).map(x => x.data);
    }

    sendMessage(id: number, message: any, chat: boolean): void {
        console.log("sending message", message);
        let inputMessageInfo = {
            conversationId: id,
            chatId: (chat ? id : null),
            body: message.body,
            attachments: message.attachments
        } as InputMessageInfo;
        this.chromeapi.PostPortMessage({ name: "send_message", data: inputMessageInfo });
    }

    typeMessage(id: number, message: any, chat: boolean): void {
        console.log("type message", id, message, chat);
        let inputMessageInfo = {
            conversationId: id,
            chatId: (chat ? id : null),
            body: message.body,
            attachments: message.attachments
        } as InputMessageInfo;
        this.chromeapi.PostPortMessage({ name: "type_message", data: inputMessageInfo });
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
}