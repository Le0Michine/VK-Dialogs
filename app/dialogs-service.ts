import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs } from '@angular/http';
import { Observable }     from 'rxjs/Observable';

import { VKService } from './vk-service';
import { VKConsts } from './vk-consts';
import { Message, Chat } from './message';

@Injectable()
export class DialogService {
    private get_dialogs: string = "messages.getDialogs";

    constructor(private vkservice: VKService, private http: Http) { }

    getDialogs(): Observable<Message[]> {
        console.log('dialogs requested');
        let uri: string = VKConsts.api_url + this.get_dialogs 
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&v=" + VKConsts.api_version;
        return this.http.get(uri).map(response => this.toDialogs(response.json()));
    }

    /*getChatPhoto(ids: number[]): Observable<string[]> {
        console.log('chat photo requested');
        let uri: string = VKConsts.api_url + "messages.getChat" 
            + "?access_token=" + this.vkservice.getSession().access_token
            + "&chat_ids=" + ids.join()
            + "&fields=photo_50"
            + "&v=" + VKConsts.api_version;
        return this.http.get(uri).map(resp => resp.json()).map(json => this.toChatPhoto(json));
    }*/

    private toDialogs(json): Message[] {
        let count: number = Number(json['response']['count']);
        console.log('dialogs cout ' + count);
        let messages = json['response']['items'];
        let dialogs: Message[] = [];
        for (let message_json of messages) {
            let m = message_json['message'];
            if (m['chat_id']) {
                let chat: Chat = m as Chat;
                dialogs.push(chat);
            }
            else {
                let message: Message = m as Message;
                dialogs.push(message);
            }
        }
        return messages;
    }
}