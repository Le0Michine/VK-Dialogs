import { Injectable } from '@angular/core';

import { VKConsts } from '../app/vk-consts';
import { Message, Chat } from '../app/message';
import { Dialog } from '../app/dialog';
import { User } from '../app/user';

@Injectable()
export class CacheService {
    dialogs_cache: Dialog[] = [];
    messages_cache: {} = {}; /* conversation id -> messages list */
    users_cache: {} = {}; /* user id -> user */

    pushMessage(new_message: any) {
        let is_chat = new_message.chat_id ? true : false;
        let inserted = false;
        for (let i = 0; i < this.dialogs_cache.length; i++) {
            if (is_chat && this.dialogs_cache[i].message['chat_id'] === new_message['chat_id'] ||
                !is_chat && this.dialogs_cache[i].message.user_id === new_message.user_id) {

                if (new_message.id === this.dialogs_cache[i].message.id) {
                    console.log('the message is already in cache: ' + JSON.stringify(new_message));
                    inserted = true;
                    break;
                }

                this.dialogs_cache[i].message = new_message;
                this.messages_cache[is_chat ? new_message['chat_id'] : new_message.user_id].push(new_message);
                if (!new_message.read_state) {
                    this.dialogs_cache[i].unread++;
                }
                else {
                    this.dialogs_cache[i].unread = 0;
                }
                inserted = true;
                break;
            }
        }
        if (!inserted) {
            let new_dialog = new Dialog();
            new_dialog.unread = new_message.read_state ? 0 : 1;
            new_dialog.message = new_message;
            this.dialogs_cache.push(new_dialog);
            this.messages_cache[is_chat ? new_message['chat_id'] : new_message.user_id] = [new_message];
        }
    }

    updateDialogs(dialogs: Dialog[]) {
        this.dialogs_cache = dialogs;
        this.messages_cache = {};
        for (let dialog of dialogs) {
            this.messages_cache[dialog.message['chat_id'] || dialog.message.user_id] = dialog.message;
        }
    }

    updateHistory(messages) {
        this.messages_cache[messages[0].chat_id || messages[0].user_id] = messages;
    }
}