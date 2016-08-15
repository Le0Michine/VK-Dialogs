import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs } from '@angular/http';
import { Observable }     from 'rxjs/Rx';

import { VKConsts } from '../app/vk-consts';
import { Message, Chat } from '../app/message';
import { User } from '../app/user';

import { VKService } from './vk-service';
import { ErrorHelper } from './error-helper';

@Injectable()
export class DialogService {
    private get_dialogs: string = "messages.getDialogs";
    private get_history: string = "messages.getHistory";
    private get_chat: string = "messages.getChat";
    private get_message: string = "messages.getById";
    private send_message: string = "messages.send";

    private cached_dialogs: Message[];

    constructor(private vkservice: VKService, private http: Http) {
        console.log('session is valid, start monitoring');
        this.startMonitoring();
     }

    startMonitoring() {
        Observable.interval(2000).subscribe(() => { 
            if (this.vkservice.getSession()) {
                this.getDialogs().subscribe(dialogs => {
                    this.cached_dialogs = dialogs;
                });
            } 
        });
    }

    getCachedDialogs() {
        if (this.cached_dialogs) {
            let res = Observable.bindCallback((callback: (dialogs: Message[]) => void) => callback(this.cached_dialogs));
            return res();
        }
        return this.getDialogs();
    }

    getDialogs(): Observable<Message[]> {
        console.log('dialogs are requested');
        let uri: string = VKConsts.api_url + this.get_dialogs 
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version;
        return this.http.get(uri).map(response => this.toMessages(response.json(), true));
    }

    getHistory(id: number, chat: boolean, count: number = 20) {
        console.log('history is requested');
        let uri: string = VKConsts.api_url + this.get_history
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version
            + (chat ? "&chat_id=" + id : "&user_id=" + id)
            + "&count=" + count
            + "&rev=0";

        return this.http.get(uri).map(response => this.toMessages(response.json(), false));
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
        return this.http.get(uri).map(response => this.toMessages(response.json(), false));
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

    private toMessages(json, update_badge: boolean): Message[] {
        if (ErrorHelper.checkErrors(json)) return [];
        json = json.response || json;
        let count: number = Number(json.count);
        console.log('messages cout ' + count);
        let messages_json = json.items;
        let dialogs: Message[] = [];

        if (update_badge) {
            this.setBadgeNumber(json.unread_dialogs ? json.unread_dialogs : '');
        }

        for (let message_json of messages_json) {
            let m = message_json.message || message_json;
            if (message_json.unread) {
                m.unread_count = message_json.unread;
            }
            if (m['chat_id']) {
                let chat: Chat = m as Chat;
                dialogs.push(chat);
            }
            else {
                let message: Message = m as Message;
                dialogs.push(message);
            }
        }
        return dialogs;
    }

    private setBadgeNumber(n: number) {
        chrome.browserAction.setBadgeText({text: String(n)});
    }
}