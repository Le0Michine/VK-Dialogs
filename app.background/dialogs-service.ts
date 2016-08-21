import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs, RequestOptions } from '@angular/http';
import { Observable }     from 'rxjs/Rx';
import 'rxjs/add/operator/timeout';

import { VKConsts } from '../app/vk-consts';
import { Message, Chat } from '../app/message';
import { Dialog } from '../app/dialog';
import { User } from '../app/user';

import { VKService } from './vk-service';
import { ErrorHelper } from './error-helper';
import { LongPollServer } from './long-poll-server';
import { LPSHelper } from './lps-helper';
import { CacheService } from './cache-service';
import { UserService } from './user-service';
import { LPSService } from './lps-service';
import { Channels } from './channels';

@Injectable()
export class DialogService {
    private get_dialogs: string = "messages.getDialogs";
    private get_history: string = "messages.getHistory";
    private get_chat: string = "messages.getChat";
    private get_message: string = "messages.getById";
    private send_message: string = "messages.send";
    private mark_as_read: string = 'messages.markAsRead';
    private get_lps: string = 'messages.getLongPollServer';

    server: LongPollServer = null;

    update_dialogs_port: chrome.runtime.Port;
    update_history_port: chrome.runtime.Port;
    update_users_port: chrome.runtime.Port;
    current_dialog_id: number = null;
    is_chat: boolean = null;

    dialogs_count: number = 20; 

    constructor(
        private vkservice: VKService,
        private http: Http,
        private cache: CacheService,
        private userService: UserService,
        private lpsService: LPSService) {

        this.getDialogs().subscribe(dialogs => {
                this.lpsService.subscribeOnMessagesUpdate(() => this.updateMessages());
                this.cache.updateDialogs(dialogs);

                let users = [];
                for (let dialog of this.cache.dialogs_cache) {
                    users.push(dialog.message.user_id);
                }   
                this.userService.loadUsers(users.join());
                this.postDialogsUpdate();
            },
            error => this.handleError(error)
        );
        chrome.runtime.onConnect.addListener(port => {
            console.log(port.name + ' port opened');
            switch (port.name) {
                case 'dialogs_monitor':
                    this.update_dialogs_port = port;
                    this.update_dialogs_port.onDisconnect.addListener(() => this.update_dialogs_port = null);
                    this.postDialogsUpdate();
                    this.update_dialogs_port.onMessage.addListener((message: any) => {
                        if (message.name === Channels.load_old_dialogs_request) {
                            this.loadOldDialogs();
                        }
                    });
                    break;
                case 'history_monitor':
                    this.update_history_port = port;
                    this.update_history_port.onMessage.addListener((message: any) => {
                        if (message.name === 'conversation_id') {
                            this.current_dialog_id = message.id;
                            this.is_chat = message.is_chat;
                            this.getHistory(this.current_dialog_id, this.is_chat).subscribe(history => {
                                this.cache.updateHistory(history);
                                this.postHistoryUpdate();
                                if (this.is_chat) {
                                    this.getChatParticipants(this.current_dialog_id).subscribe(users => {
                                        this.cache.pushUsers(users);
                                        this.userService.postUsersUpdate();
                                    });
                                }
                            });
                        }
                    });
                    this.update_history_port.onDisconnect.addListener(() => {
                        this.update_history_port = null;
                        this.current_dialog_id = null;
                        this.is_chat = null;
                    });
                    break;
            }
        });
    }

    postDialogsUpdate() {
        if (this.update_dialogs_port) {
            console.log('post dialogs_update message');
            this.update_dialogs_port.postMessage({name: 'dialogs_update', data: this.cache.dialogs_cache});
        }
        else {
            console.log('port dialogs_monitor is closed');
        }
    }

    postHistoryUpdate() {
        if (this.update_history_port && this.current_dialog_id) {
            console.log('post history_update message');
            this.update_history_port.postMessage({name: 'history_update', data: this.cache.messages_cache[this.current_dialog_id]});
        }
        else {
            console.log('port history_monitor is closed or current_dialog_id isn\'t specified');
        }
    }

    updateMessages() {
        this.getDialogs().subscribe(dialogs => {
                this.cache.updateDialogs(dialogs);
                this.postDialogsUpdate();
            });

            if (this.update_history_port && this.current_dialog_id) {
                    this.getHistory(this.current_dialog_id, this.is_chat).subscribe(history => {
                    this.cache.updateHistory(history);
                    this.postHistoryUpdate();
            });
        }
    }

    getCachedDialogs(): Observable<Dialog[]> {
        if (this.cache.dialogs_cache && this.cache.dialogs_cache.length > 0) {
            let res = Observable.bindCallback((callback: (dialogs: Dialog[]) => void) => callback(this.cache.dialogs_cache));
            return res();
        }
        return this.getDialogs();
    }

    loadOldDialogs() {
        console.log('load old dialogs');
        this.dialogs_count += 20;
        this.getDialogs().subscribe(dialogs => {
            this.cache.updateDialogs(dialogs);
            let users = [];
            for (let dialog of this.cache.dialogs_cache) {
                users.push(dialog.message.user_id);
            }   
            this.userService.loadUsers(users.join());
            this.postDialogsUpdate();
        },
        error => this.handleError(error),
        () => console.log('old dialogs loaded'));
    }

    getDialogs(): Observable<Dialog[]> {
        console.log('dialogs are requested');
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_dialogs 
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&count=" + this.dialogs_count;
            return this.http.get(uri).map(response => this.toDialog(response.json()));
        });
    }

    getHistory(id: number, chat: boolean, count: number = 20): Observable<Message[]> {
        console.log('history is requested');
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_history
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + (chat ? "&chat_id=" + id : "&user_id=" + id)
                + "&count=" + count
                + "&rev=0";

            return this.http.get(uri).map(response => this.toMessages(response.json()));
        });
    }

    getChatParticipants(chat_id: number): Observable<{}> {
        console.log('chat participants requested');
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_chat
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&chat_id=" + chat_id
                + "&fields=first_name,photo_50";
        
            return this.http.get(uri).map(response => this.toUserDict(response.json()));
        });
    }

    getMessage(ids: string): Observable<Message[]> {
        console.log('requested message(s) with id: ' + ids);
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_message
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&message_ids=" + ids; 
            return this.http.get(uri).map(response => this.toMessages(response.json()));
        });
    }

    markAsRead(ids: string): Observable<number> {
        console.log('mark as read message(s) with id: ' + ids);
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.mark_as_read
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&message_ids=" + ids; 
            return this.http.get(uri).map(response => response.json());
        });
    }

    sendMessage(id: number, message: string, chat: boolean): Observable<Message> {
        console.log('sending message');
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.send_message
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + (chat ? "&chat_id=" : "&user_id=") + id 
                + "&message=" + message 
                + "&notification=1";
            return this.http.get(uri).map(response => response.json().response);
        });
    }

    private toUserDict(json): {} {
        if (ErrorHelper.checkErrors(json)) return {};
        let users = {};
        for (let user_json of json.response.users) {
            users[user_json.id] = user_json as User;
        }

        return users;
    }

    private toDialog(json): Dialog[] {
        if (ErrorHelper.checkErrors(json)) return [];
        json = json.response || json;
        console.log('dialogs cout ' + json.count);
        this.setBadgeNumber(json.unread_dialogs ? json.unread_dialogs : '');

        return json.items as Dialog[];
    }

    private toMessages(json): Message[] {
        if (ErrorHelper.checkErrors(json)) return [];
        json = json.response || json;
        console.log('messages cout ' + json.count);

        return json.items as Message[];
    }

    private setBadgeNumber(n: number) {
        chrome.browserAction.setBadgeText({text: String(n)});
    }

    private handleError(error: any) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}