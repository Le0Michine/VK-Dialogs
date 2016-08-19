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

    constructor(private vkservice: VKService, private http: Http, private cache: CacheService, private userService: UserService) {
        this.getDialogs().subscribe(dialogs => {
                this.cache.updateDialogs(dialogs);
                this.postDialogsUpdate();
                this.startMonitoring();

                let users = [];
                for (let dialog of this.cache.dialogs_cache) {
                    users.push(dialog.message.user_id);
                }   
                this.userService.loadUsers(users.join());
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

    startMonitoring(ts: number = null) {
        console.log('session is valid, start monitoring');
        this.getLongPollServer().subscribe(
            server => {
                if (ts) {
                    server.ts = ts;
                }
                this.nextRequest(server);
            },
            error => {
                console.log('error ocured during lps request: ' + error);
                console.log('restart monitoring');
                this.startMonitoring();
            });
    }

    processLongPollResponse(json) {
        let updates = json.updates;
        for (let update of updates) {
            switch (update[0]) {
                case 0: 
                    /* 0,$message_id,0 -- delete a message with the local_id indicated */
                    break;
                case 1: 
                    /* 1,$message_id,$flags -- replace message flags (FLAGS:=$flags) */
                    break;
                case 2: 
                    /* 2,$message_id,$mask[,$user_id] -- install message flags (FLAGS|=$mask) */
                    break;
                case 3: 
                    /* 3,$message_id,$mask[,$user_id] -- reset message flags (FLAGS&=~$mask) */
                    this.updateMessages();
                    break;
                case 4: 
                    /* 4,$message_id,$flags,$from_id,$timestamp,$subject,$text,$attachments -- add a new message */
                    this.updateMessages();
                    break;
                case 6: 
                    /* 6,$peer_id,$local_id -- read all incoming messages with $peer_id until $local_id */
                    break;
                case 7: 
                    /* 7,$peer_id,$local_id -- read all outgoing messages with $peer_id until $local_id */
                    break;
                case 8: 
                    /* 8,-$user_id,$extra -- a friend of $user_id is online, $extra is not 0 if flag 64 was transmitted in mode.
                    $extra mod 256 is a platform id (see the list below) */
                    break;
                case 9: 
                    /* 9,-$user_id,$flags -- a friend of $user_id is offline 
                    ($flags equals 0 if the user has left the site 
                    (for example, clicked on "Log Out"), 
                    and 1 if offline upon timeout (for example, the status is set to "away")) */
                    break;
                case 51: 
                    /* 51,$chat_id,$self -- one of $chat_id's parameters (title, participants) was changed. 
                    $self shows if changes were made by user themself */
                    break;
                case 61:
                    /* 61,$user_id,$flags -- $user_id started typing text in a dialog. 
                    The event is sent once in ~5 sec while constantly typing. $flags = 1 */
                    break;
                case 62: 
                    /* 62,$user_id,$chat_id — $user_id started typing in $chat_id. */
                    break;
                case 70: 
                    /* 70,$user_id,$call_id — $user_id made a call with $call_id identifier. */
                    break;
                case 80: 
                    /* 80,$count,0 — new unread messages counter in the left menu equals $count. */
                    break;
                case 114: 
                    /* 114,{ $peerId, $sound, $disabled_until } — notification settings changed, 
                    where peerId is a chat's/user's $peer_id, 
                    sound — 1 || 0, sound notifications on/off, 
                    disabled_until — notifications disabled for a certain period 
                    (-1: forever; 0: notifications enabled; other: timestamp for time to switch back on). */
                    break;
                default:
                    console.log('unknow code of update ' +  JSON.stringify(update) + ' in long poll response: ' + JSON.stringify(json));
                    break;
            }
        }
    }

    nextRequest(server: LongPollServer) {
        this.startLongPollRequest(server).subscribe(response => {
            if (response.failed === 2) {
                console.log('lps key expired need to obtain the new one')
                this.startMonitoring(server.ts);
            }
            else if (response.failed === 3) {
                console.log('error ocured need to obtain a new lps key')
                this.startMonitoring(server.ts);
            }
            else if (response.failed === 3) {
                console.log('history became obsolet need to refresh it first')
                this.getDialogs().subscribe(dialogs => {
                    this.cache.updateDialogs(dialogs);
                    server.ts = response.ts;
                    this.nextRequest(server);
                },
                error => this.handleError(error));
            }
            else {
                console.log(new Date(Date.now()) + ' got a long poll response: ' + JSON.stringify(response));
                server.ts = response.ts;
                this.processLongPollResponse(response);
                this.nextRequest(server);
            }
        },
        error => {
            console.log('error ocured during lp request: ' + error);
            console.log('trying to reconnect');
            this.startMonitoring(server.ts);
        });
    }

    getLongPollServer(): Observable<LongPollServer> {
        console.log('lps requested');
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_lps
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&use_ssl=1";
            return this.http.get(uri).map(response => response.json().response);
        });
    }

    startLongPollRequest(server: LongPollServer) {
        console.log(new Date(Date.now()) + ' perform a long poll request');
        let uri: string = "http://" + server.server + "?act=a_check&key=" + server.key + "&ts=" + server.ts + "&wait=25&mode=2";
        return this.http.get(uri).timeout(35000, new Error('30s timeout ocured')).map(response => response.json());
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

    getDialogs(): Observable<Dialog[]> {
        console.log('dialogs are requested');
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_dialogs 
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version;
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