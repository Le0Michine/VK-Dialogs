import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs } from '@angular/http';
import { Observable }     from 'rxjs/Rx';

import { VKConsts } from '../app/vk-consts';
import { Message, Chat } from '../app/message';
import { Dialog } from '../app/dialog';
import { User } from '../app/user';

import { VKService } from './vk-service';
import { ErrorHelper } from './error-helper';
import { LongPollServer } from './long-poll-server';

@Injectable()
export class DialogService {
    private get_dialogs: string = "messages.getDialogs";
    private get_history: string = "messages.getHistory";
    private get_chat: string = "messages.getChat";
    private get_message: string = "messages.getById";
    private send_message: string = "messages.send";
    private mark_as_read: string = 'messages.markAsRead';
    private get_lps: string = 'messages.getLongPollServer';

    private cached_dialogs: Dialog[];

    server: LongPollServer = null;

    updates_port: chrome.runtime.Port;

    constructor(private vkservice: VKService, private http: Http) {
        console.log('session is valid, start monitoring');
        this.startMonitoring();
     }

    startMonitoring() {
        this.getLongPollServer().subscribe(server => this.nextRequest(server));
    }

    processLongPollResponse(json) {
        let updates = json.updates;
        let messages = json.messages;
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
                    break;
                case 4: 
                    /* 4,$message_id,$flags,$from_id,$timestamp,$subject,$text,$attachments -- add a new message */
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
                    console.log('unknow code {update[0]} in long poll response: ' + JSON.stringify(json));
                    break;
            }
        }
    }

    nextRequest(server: LongPollServer) {
        this.startLongPollRequest(server).subscribe(response => {
            if (response.failed === 2) {
                console.log('lps key expired need to obtain the new one')
                this.startMonitoring();
            }
            else if (response.failed === 3) {
                console.log('error ocured need to obtain a new lps key')
                this.startMonitoring();
            }
            else if (response.failed === 3) {
                console.log('history became obsolet need to refresh it first')
                this.getDialogs().subscribe(dialogs => {
                    this.cached_dialogs = dialogs;
                    server.ts = response.ts;
                    this.nextRequest(server);
                });
            }
            else {
                console.log(new Date(Date.now()) + ' got long poll response: ' + JSON.stringify(response));
                server.ts = response.ts;
                this.processLongPollResponse(response);
                this.nextRequest(server);
            }
        })
    }

    getLongPollServer(): Observable<LongPollServer> {
        let uri: string = VKConsts.api_url + this.get_lps
                + "?access_token=" + this.vkservice.getSession().access_token
                + "&v=" + VKConsts.api_version
                + "&use_ssl=1";
        return this.http.get(uri).map(response => response.json().response);
    }

    startLongPollRequest(server: LongPollServer) {
        let uri: string = "http://" + server.server + "?act=a_check&key=" + server.key + "&ts=" + server.ts + "&wait=25&mode=2";
        return this.http.get(uri).map(response => response.json());
    }

    getCachedDialogs(): Observable<Dialog[]> {
        if (this.cached_dialogs) {
            let res = Observable.bindCallback((callback: (dialogs: Dialog[]) => void) => callback(this.cached_dialogs));
            return res();
        }
        return this.getDialogs();
    }

    getDialogs(): Observable<Dialog[]> {
        console.log('dialogs are requested');
        let uri: string = VKConsts.api_url + this.get_dialogs 
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version;
        return this.http.get(uri).map(response => this.toDialog(response.json()));
    }

    getHistory(id: number, chat: boolean, count: number = 20): Observable<Message[]> {
        console.log('history is requested');
        let uri: string = VKConsts.api_url + this.get_history
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version
            + (chat ? "&chat_id=" + id : "&user_id=" + id)
            + "&count=" + count
            + "&rev=0";

        return this.http.get(uri).map(response => this.toMessages(response.json()));
    }

    getChatParticipants(chat_id: number): Observable<{}> {
        console.log('chat participants requested');
        let uri: string = VKConsts.api_url + this.get_chat
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version
            + "&chat_id=" + chat_id
            + "&fields=first_name,photo_50";
        
        return this.http.get(uri).map(response => this.toUserDict(response.json()));
    }

    getMessage(ids: string): Observable<Message[]> {
        console.log('requested message(s) with id: ' + ids);
        let uri: string = VKConsts.api_url + this.get_message
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version
            + "&message_ids=" + ids; 
        return this.http.get(uri).map(response => this.toMessages(response.json()));
    }

    markAsRead(ids: string): Observable<number> {
        console.log('mark as read message(s) with id: ' + ids);
        let uri: string = VKConsts.api_url + this.mark_as_read
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version
            + "&message_ids=" + ids; 
        return this.http.get(uri).map(response => response.json());
    }

    sendMessage(id: number, message: string, chat: boolean): Observable<Message> {
        console.log('sending message');
        let uri: string = VKConsts.api_url + this.send_message
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version
            + (chat ? "&chat_id=" : "&user_id=") + id 
            + "&message=" + message 
            + "&notification=1";
        return this.http.get(uri).map(response => response.json().response);
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
}