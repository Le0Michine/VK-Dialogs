import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs } from '@angular/http';
import { Observable }     from 'rxjs/Observable';
import { Scheduler }     from 'rxjs/Scheduler';

import { VKService } from './vk-service';
import { Message, Chat } from './message';
import { Dialog } from './dialog';
import { User } from './user';
import { Channels } from '../app.background/channels';
import { RequestHelper } from './request-helper';

@Injectable()
export class DialogService {
    private dialogs_port: chrome.runtime.Port;
    private history_port: chrome.runtime.Port;

    chat_observable: Observable<{}>;
    dialogs_observable: Observable<{}>;
    history_observable: Observable<{}>;

    private chats;

    constructor(private vkservice: VKService, private http: Http) {
        this.initializeDialogsMonitor();
        this.initChatsUpdate();
        this.initDialogsUpdate();
        this.initHistoryUpdate();
    }

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

    getChatParticipants(id: number): Observable<{}> {
        return RequestHelper.sendRequestToBackground({name: Channels.get_chat_participants_request, chat_id: id});
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
        this.initializeHistoryMonitor();
        this.history_port.onMessage.addListener((message: any) => {
            if (message.name === Channels.messages_count_update) {
                console.log('got messages_count_update message');
                callback(message.data);
            }
        });
    }

    initChatsUpdate(): void {
        this.initializeDialogsMonitor();
        this.chat_observable = Observable.fromEventPattern(
            (h: (Object) => void) => this.dialogs_port.onMessage.addListener((message: any) => {
                if (message.name === Channels.update_chats && message.data) {
                    console.log('got chats_update message');
                    h(message.data);
            }}),
            (h: (Object) => void) => this.dialogs_port.onMessage.removeListener(h)
        );
    }

    initDialogsUpdate(): void {
        this.initializeDialogsMonitor();
        this.dialogs_observable = Observable.fromEventPattern(
            (h: (x: Dialog[]) => void) => this.dialogs_port.onMessage.addListener((message: any) => {
                if (message.name === 'dialogs_update' && message.data) {
                    console.log('got dialogs_update message');
                    h(message.data as Dialog[])
                }
            }),
            (h: (x: Dialog[]) => void) => this.dialogs_port.onMessage.removeListener(h)
        );
    }

    initHistoryUpdate() {
        this.initializeHistoryMonitor();
        this.history_observable = Observable.fromEventPattern(
            (h: (x: Message[]) => void) => {
                this.history_port.onMessage.addListener((message: any) => {
                if (message.name === 'history_update' && message.data) {
                    console.log('got history_monitor message');
                    h(message.data as Message[])
                }
            })},
            (h: (x: Message[]) => void) => this.history_port.onMessage.removeListener(h)
        );
    }

    setCurrentConversation(conversation_id, is_chat) {
        this.history_port.postMessage({name: 'conversation_id', id: conversation_id, is_chat: is_chat});
    }

    requestDialogs() {
        this.dialogs_port.postMessage({name: Channels.get_dialogs_request});
    }

    requestChats() {
        this.dialogs_port.postMessage({name: Channels.get_chats_request});
    }

    disconnectDialogs(): void {
        this.dialogs_port.disconnect();
        this.dialogs_port = null;
    }

    private initializeDialogsMonitor() {
        if (!this.dialogs_port) {
            this.dialogs_port = chrome.runtime.connect({name: 'dialogs_monitor'});
        }
    }

    private initializeHistoryMonitor() {
        if (!this.history_port) {
            this.history_port = chrome.runtime.connect({name: 'history_monitor'});
        }
    }
}