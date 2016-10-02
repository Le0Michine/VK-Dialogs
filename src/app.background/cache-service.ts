import { Injectable } from "@angular/core";

import { VKConsts } from "../app/vk-consts";
import { SingleMessageInfo, UserInfo, DialogInfo, DialogsInfo, ChatInfo, HistoryInfo } from "./datamodels/datamodels";

@Injectable()
export class CacheService {
    dialogs_cache: DialogsInfo = new DialogsInfo();
    messages_cache: {[id: number] : HistoryInfo} = {}; /* conversation id -> { messages list, messages count } */
    users_cache: { [id: number] : UserInfo } = {}; /* user id -> user */
    chats_cache: { [id: number] : ChatInfo } = {}; /* chat id -> users array */

    constructor() {
        this.dialogs_cache.count = 0;
        this.dialogs_cache.dialogs = [];
    }

    updateChats(chats): void {
        this.chats_cache = chats;
    }

    private updateDialogs(dialogs: DialogsInfo): void {
        console.log("update dialogs");
        this.dialogs_cache = dialogs;
    }

    pushDialogs(dialogsInfo: DialogsInfo): boolean {
        console.log("pushing dialogs: ", dialogsInfo);
        let dialogs = dialogsInfo.dialogs;
        if (!dialogs || dialogs.length === 0) {
            return;
        }
        this.dialogs_cache.count = dialogsInfo.count;
        let firstId = dialogs[0].message.id;
        let lastId = dialogs[0].message.id;
        let i = this.dialogs_cache.dialogs.findIndex(x => x.message.id === firstId);
        if (i === -1 || i === 0) {
            i = this.dialogs_cache.dialogs.findIndex(x => x.message.id === lastId);
            if (i === -1) {
                this.updateDialogs(dialogsInfo);
            }
            else {
                this.dialogs_cache.dialogs = dialogs.concat(this.dialogs_cache.dialogs.slice(i + 1, this.dialogs_cache.dialogs.length - 1));
            }
        }
        else if (i === 0) {
            return false;
        }
        else {
            this.dialogs_cache.dialogs = this.dialogs_cache.dialogs.slice(0, i).concat(dialogs);
        }
        return true;
    }

    private updateHistory(messages: SingleMessageInfo[], count: number = null): void {
        let conversation_id = messages[0].conversationId;
        if (!this.messages_cache[conversation_id]) this.messages_cache[conversation_id] = new HistoryInfo();
        this.messages_cache[conversation_id].messages = messages;
        if (count) this.messages_cache[conversation_id].count = count;
    }

    /** count -- total amount of messages */
    pushHistory(messages: SingleMessageInfo[], count: number = null): boolean {
        let conversation_id = messages[0].conversationId;
        if (this.messages_cache[conversation_id] && this.messages_cache[conversation_id].messages) {
            let i = this.messages_cache[conversation_id].messages.findIndex(m => m.id === messages[0].id);
            if (i === -1 || i === 0) {
                i = this.messages_cache[conversation_id].messages.findIndex(m => m.id === messages[messages.length - 1].id);
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

    getLastMessageId(conversation_id: number): number {
        let l = this.messages_cache[conversation_id].messages.length;
        return this.messages_cache[conversation_id].messages[l - 1].id;
    }

    getLastDialogMessageId(): number {
        if (this.dialogs_cache.dialogs.length === 0) return null;
        return this.dialogs_cache.dialogs[this.dialogs_cache.dialogs.length - 1].message.id;
    }

    getHistory(conversation_id: number): SingleMessageInfo[] {
        let h = this.messages_cache[conversation_id];
        return h ? h.messages : [];
    }

    getMessagesCount(conversation_id: number): number {
        let h = this.messages_cache[conversation_id];
        return h ? h.count : 0;
    }

    pushUsers(users): void {
        console.log("push users: ", users);
        for (let user_id in users) {
            this.users_cache[user_id] = users[user_id];
        }
    }

    private getMessageCache(message: SingleMessageInfo) {
        return message ? "" + message.id + message.isRead + message.out + message.date + message.userId : undefined;
    }
}