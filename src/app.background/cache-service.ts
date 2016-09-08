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

    private updateDialogs(dialogs: Dialog[]) {
        console.log("update dialogs");
        this.dialogs_cache = dialogs;
        // this.messages_cache = {};
        // for (let dialog of dialogs) {
            // this.messages_cache[dialog.message["chat_id"] || dialog.message.user_id] = dialog.message;
        // }
    }

    pushDialogs(dialogs: Dialog[]) {
        console.log("pushing dialogs: ", dialogs);
        if (!dialogs || dialogs.length === 0) return;
        let firstId = dialogs[0].message.id;
        let lastId = dialogs[0].message.id;
        let i = this.dialogs_cache.findIndex(x => x.message.id === firstId);
        if (i === -1 || i === 0 && this.getMessageCache(dialogs[0].message) !== this.getMessageCache(this.dialogs_cache[0].message)) {
            i = this.dialogs_cache.findIndex(x => x.message.id === lastId);
            if (i === -1) {
                this.updateDialogs(dialogs);
            }
            else {
                this.dialogs_cache = dialogs.concat(this.dialogs_cache.slice(i + 1, this.dialogs_cache.length - 1));
            }
        }
        else if (i === 0) {
            return false;
        }
        else {
            this.dialogs_cache = this.dialogs_cache.slice(0, i).concat(dialogs);
        }
    }

    private updateHistory(messages: Message[], count: number = null) {
        let conversation_id = (messages[0] as Chat).chat_id || messages[0].user_id;
        if (!this.messages_cache[conversation_id]) this.messages_cache[conversation_id] = {};
        this.messages_cache[conversation_id].messages = messages;
        if (count) this.messages_cache[conversation_id].count = count;
    }

    /** count -- total amount of messages */
    pushHistory(messages: Message[], count: number = null): boolean {
        let conversation_id = (messages[0] as Chat).chat_id || messages[0].user_id;
        if (this.messages_cache[conversation_id] && this.messages_cache[conversation_id].messages) {
            let i = this.messages_cache[conversation_id].messages.findIndex((m: Message) => m.id === messages[0].id);
            if (i === -1 || i === 0 && this.getMessageCache(messages[0]) !== this.getMessageCache(this.messages_cache[conversation_id][0])) {
                i = this.messages_cache[conversation_id].messages.findIndex((m: Message) => m.id === messages[messages.length - 1].id);
                if (i === -1) { /** cache is invalid, refreshing */
                    this.updateHistory(messages, count);
                }
                else { /** add messages to the begining */
                    let tmp = this.messages_cache[conversation_id].messages;
                    this.messages_cache[conversation_id].messages = messages.concat(tmp.slice(i + 1, tmp.length - i));
                }
            }
            else if (i === 0) { /** nothing to update */
                return false;
            }
            else { /** add messages to the end */
                this.messages_cache[conversation_id].messages = this.messages_cache[conversation_id].messages.slice(0, i).concat(messages);
            }
        }
        else {
            this.updateHistory(messages, count);
        }
        return true;
    }

    getLastMessageId(conversation_id: number) {
        let l = this.messages_cache[conversation_id].messages.length;
        return this.messages_cache[conversation_id].messages[l - 1].id;
    }

    getLastDialogMessageId(): number {
        if (this.dialogs_cache.length === 0) return null;
        return this.dialogs_cache[this.dialogs_cache.length - 1].message.id;
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

    private getMessageCache(message: Message) {
        return message ? "" + message.id + message.read_state + message.out + message.date + message.user_id : undefined;
    }
}