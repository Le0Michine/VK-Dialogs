import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs } from '@angular/http';
import { Observable, Scheduler }     from 'rxjs/Rx';

import { VKService } from './vk-service';
import { VKConsts } from './vk-consts';
import { Message, Chat } from './message';
import { User } from './user';
import { Channels } from '../app.background/channels';

@Injectable()
export class DialogService {
    private get_dialogs: string = "messages.getDialogs";
    private get_history: string = "messages.getHistory";
    private get_chat: string = "messages.getChat";
    private get_message: string = "messages.getById";
    private send_message: string = "messages.send";

    constructor(private vkservice: VKService, private http: Http) { }

    getDialogs(): Observable<Message[]> {
        console.log('dialogs are requested');
        return this.sendRequestToBackground({name: Channels.get_dialogs_request});
    }

    getHistory(id: number, chat: boolean) {
        console.log('history is requested');
        return this.sendRequestToBackground({
            name: Channels.get_history_request,
            conversation_id: id,
            is_chat: chat
        });
    }

    getChatParticipants(chat_id: number): Observable<{}> {
        console.log('chat participants requested');
        return this.sendRequestToBackground({
            name: Channels.get_chat_participants_request,
            'chat_id': chat_id
        });
    }

    getMessage(ids: string): Observable<Message[]> {
        console.log('requested message(s) with id: ' + ids);
        return this.sendRequestToBackground({
            name: Channels.get_message_request,
            message_ids: ids
        });
    }

    sendMessage(id: number, message: string, chat: boolean): Observable<Message> {
        console.log('sending message');
        return this.sendRequestToBackground({
            name: Channels.send_message_request,
            user_id: id,
            message_body: message,
            is_chat: chat
        });
    }

    private sendRequestToBackground(request: any): Observable<any> {
        let result = Observable.bindCallback((callback: (dialogs: any) => void) => {
            chrome.extension.sendRequest(
                request,
                (response: any) => {
                    console.log('response obtained for request: ' + request.name);
                    callback(response.data);
                }
            );
        });
        return result();
    }
}