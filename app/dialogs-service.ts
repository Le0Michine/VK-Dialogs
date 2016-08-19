import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs } from '@angular/http';
import { Observable, Scheduler }     from 'rxjs/Rx';

import { VKService } from './vk-service';
import { VKConsts } from './vk-consts';
import { Message, Chat } from './message';
import { Dialog } from './dialog';
import { User } from './user';
import { Channels } from '../app.background/channels';
import { RequestHelper } from './request-helper';

@Injectable()
export class DialogService {
    private dialogs_port: chrome.runtime.Port;
    private history_port: chrome.runtime.Port;

    constructor(private vkservice: VKService, private http: Http) { }

    markAsRead(ids: string): Observable<number> {
        console.log('requested message(s) with id: ' + ids);
        return RequestHelper.sendRequestToBackground({
            name: Channels.mark_as_read_request,
            message_ids: ids
        });
    }

    sendMessage(id: number, message: string, chat: boolean): Observable<Message> {
        console.log('sending message');
        return RequestHelper.sendRequestToBackground({
            name: Channels.send_message_request,
            user_id: id,
            message_body: message,
            is_chat: chat
        });
    }

    subscribeOnDialogsUpdate(callback: (x: Dialog[]) => void) {
        this.dialogs_port = chrome.runtime.connect({name: 'dialogs_monitor'});
        this.dialogs_port.onMessage.addListener((message: any) => {
            if (message.name === 'dialogs_update' && message.data) {
                console.log('got dialogs_update message');
                callback(message.data as Dialog[])
            }
            else {
                console.log('unknown message in dialogs_monitor: ' + JSON.stringify(message));
            }
        });
    }

    subscribeOnHistoryUpdate(conversation_id, is_chat, callback: (x: Message[]) => void) {
        this.history_port = chrome.runtime.connect({name: 'history_monitor'});
        this.history_port.postMessage({name: 'conversation_id', id: conversation_id, is_chat: is_chat});
        this.history_port.onMessage.addListener((message: any) => {
            if (message.name === 'history_update' && message.data) {
                console.log('got history_monitor message');
                callback(message.data as Message[])
            }
            else {
                console.log('unknown message in history_monitor: ' + JSON.stringify(message));
            }
        });
    }

    unsubscribeFromDialogs() {
        this.dialogs_port.disconnect();
        this.dialogs_port = null;
    }
}