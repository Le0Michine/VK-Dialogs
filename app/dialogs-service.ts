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

    loadOldDialogs() {
        if (this.dialogs_port) {
            this.dialogs_port.postMessage({name: Channels.load_old_dialogs_request});
        }
        else {
            console.log('dialogs_monitor port isn\'t initialized');
        }
    }

    loadOldMessages() {
        if (this.history_port) {
            this.history_port.postMessage({name: Channels.load_old_messages_request});
        }
        else {
            console.log('history_monitor port isn\'t initialized');
        }
    }

    subscribeOnDialogsCountUpdate(callback: (dialogsCount: number) => void) {
        this.initializeDialogsMonitor();
        this.dialogs_port.onMessage.addListener((message: any) => {
            if (message.name === Channels.dialogs_count_update) {
                console.log('got dialogs_count_update message');
                callback(message.data);
            }
        });
    }

    subscribeOnMessagesCountUpdate(callback: (messagesCount: number) => void) {
        this.history_port.onMessage.addListener((message: any) => {
            if (message.name === Channels.messages_count_update) {
                console.log('got messages_count_update message');
                callback(message.data);
            }
        });
    }

    subscribeOnChatsUpdate(callback) {
        this.initializeDialogsMonitor();
        this.dialogs_port.onMessage.addListener((message: any) => {
            if (message.name === Channels.update_chats && message.data) {
                console.log('got chats_update message');
                callback(message.data);
            }
        });
    }

    subscribeOnDialogsUpdate(callback: (x: Dialog[]) => void) {
        this.initializeDialogsMonitor();
        this.dialogs_port.onMessage.addListener((message: any) => {
            if (message.name === 'dialogs_update' && message.data) {
                console.log('got dialogs_update message');
                callback(message.data as Dialog[])
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
        });
    }

    unsubscribeFromDialogs() {
        this.dialogs_port.disconnect();
        this.dialogs_port = null;
    }

    private initializeDialogsMonitor() {
        if (!this.dialogs_port) {
            this.dialogs_port = chrome.runtime.connect({name: 'dialogs_monitor'});
        }
    }
}