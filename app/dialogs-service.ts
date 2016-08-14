import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs } from '@angular/http';
import { Observable }     from 'rxjs/Observable';

import { VKService } from './vk-service';
import { VKConsts } from './vk-consts';
import { Message, Chat } from './message';
import { User } from './user';

@Injectable()
export class DialogService {
    private get_dialogs: string = "messages.getDialogs";
    private get_history: string = "messages.getHistory";
    private get_chat: string = "messages.getChat";

    constructor(private vkservice: VKService, private http: Http) { }

    getDialogs(): Observable<Message[]> {
        console.log('dialogs are requested');
        let uri: string = VKConsts.api_url + this.get_dialogs 
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version;
        return this.http.get(uri).map(response => this.toMessages(response.json()));
    }

    getHistory(id: number, chat: boolean) {
        console.log('history is requested');
        let uri: string = VKConsts.api_url + this.get_history
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version
            + (chat ? "&chat_id=" + id : "&user_id=" + id)
            + "&count=20"
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

    private toUserDict(json): {} {
        let users = {};
        for (let user_json of json.response.users) {
            users[user_json.id] = user_json as User;
        }

        return users;
    }

    private toMessages(json): Message[] {
        let count: number = Number(json['response']['count']);
        console.log('messages cout ' + count);
        let messages_json = json['response']['items'];
        let dialogs: Message[] = [];
        for (let message_json of messages_json) {
            let m = message_json['message'] || message_json;
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
}