import { Injectable } from "@angular/core";

import { VKConsts } from "../app/vk-consts";
import { Message, Chat } from "../app/message";
import { Dialog } from "../app/dialog";
import { User } from "../app/user";

@Injectable()
export class CacheService {
    dialogs_cache: Dialog[] = [];
    messages_cache: {} = {}; /* conversation id -> { messages list, messages count } */
    users_cache: {} = {}; /* user id -> user */
    chats_cache: {} = {}; /* chat id -> users array */

    updateChats(chats) {
        this.chats_cache = chats;
    }

    updateDialogs(dialogs: Dialog[]) {
        this.dialogs_cache = dialogs;
        this.messages_cache = {};
        // for (let dialog of dialogs) {
            // this.messages_cache[dialog.message["chat_id"] || dialog.message.user_id] = dialog.message;
        // }
    }

    updateHistory(messages: Message[], count: number = null) {
        let conversation_id = (messages[0] as Chat).chat_id || messages[0].user_id;
        if (!this.messages_cache[conversation_id]) this.messages_cache[conversation_id] = {};
        this.messages_cache[conversation_id].messages = messages;
        if (count) this.messages_cache[conversation_id].count = count;
    }

    pushHistory(messages: Message[], count: number = null) {
        let conversation_id = (messages[0] as Chat).chat_id || messages[0].user_id;
        if (this.messages_cache[conversation_id] && this.messages_cache[conversation_id].messages) {
            let i = this.messages_cache[conversation_id].messages.findIndex((m: Message) => m.id === messages[0].id);
            if (i === -1) {
                this.messages_cache[conversation_id].messages = messages;
            }
            else {
                this.messages_cache[conversation_id].messages = this.messages_cache[conversation_id].messages.splice(0, i).concat(messages);
            }
        }
        else {
            this.updateHistory(messages, count);
        }
    }

    getLastMessageId(conversation_id: number) {
        let l = this.messages_cache[conversation_id].messages.length;
        return this.messages_cache[conversation_id].messages[l - 1].id;
    }

    getHistory(conversation_id: number) {
        let h = this.messages_cache[conversation_id];
        return h ? h.messages : [];
    }

    getMessagesCount(conversation_id: number) {
        let h = this.messages_cache[conversation_id];
        return h ? h.count : 0;
    }

    pushUsers(users) {
        for (let user_id in users) {
            this.users_cache[user_id] = users[user_id];
        }
    }
}