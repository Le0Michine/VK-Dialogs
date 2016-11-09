import { Injectable } from "@angular/core";

import { VKConsts } from "../../app/vk-consts";
import { SingleMessageInfo, UserInfo, DialogInfo, DialogListInfo, ChatInfo, HistoryInfo } from "../datamodels";

@Injectable()
export class CacheService {
    dialogsCache: DialogListInfo = new DialogListInfo();
    messagesCache: {[id: number]: HistoryInfo} = {}; /* conversation id -> { messages list, messages count } */
    chatsCache: { [id: number]: ChatInfo } = {}; /* chat id -> users array */

    constructor() {
        this.dialogsCache.count = 0;
        this.dialogsCache.dialogs = [];
    }

    updateChats(chats): void {
        this.chatsCache = chats;
    }

    pushDialogs(dialogsInfo: DialogListInfo): boolean {
        console.log("pushing dialogs: ", dialogsInfo);
        let dialogs = dialogsInfo.dialogs;
        if (!dialogs || dialogs.length === 0) {
            return;
        }
        this.dialogsCache.count = dialogsInfo.count;
        let firstId = dialogs[0].message.id;
        let lastId = dialogs[0].message.id;
        let i = this.dialogsCache.dialogs.findIndex(x => x.message.id === firstId);
        if (i === -1 || i === 0) {
            i = this.dialogsCache.dialogs.findIndex(x => x.message.id === lastId);
            if (i === -1) {
                this.updateDialogs(dialogsInfo);
            }
            else {
                this.dialogsCache.dialogs = dialogs.concat(this.dialogsCache.dialogs.slice(i + 1, this.dialogsCache.dialogs.length - 1));
            }
        }
        else if (i === 0) {
            return false;
        }
        else {
            this.dialogsCache.dialogs = this.dialogsCache.dialogs.slice(0, i).concat(dialogs);
        }
        return true;
    }

    /** count -- total amount of messages */
    pushHistory(history: HistoryInfo): boolean {
        let conversationId = history.conversationId;
        if (this.messagesCache[conversationId] && this.messagesCache[conversationId].messages) {
            let i = this.messagesCache[conversationId].messages.findIndex(m => m.id === history.messages[0].id);
            if (i === -1 || i === 0) {
                i = this.messagesCache[conversationId].messages.findIndex(m => m.id === history.messages[history.messages.length - 1].id);
                if (i === -1) { /** cache is invalid, refreshing */
                    this.updateHistory(history);
                }
                else { /** add messages to the begining */
                    let tmp = this.messagesCache[conversationId].messages;
                    this.messagesCache[conversationId].messages = history.messages.concat(tmp.slice(i + 1, tmp.length - i));
                }
            }
            else if (i === 0) { /** nothing to update */
                return false;
            }
            else { /** add messages to the end */
                this.messagesCache[conversationId].messages = this.messagesCache[conversationId].messages.slice(0, i).concat(history.messages);
            }
        }
        else {
            this.updateHistory(history);
        }
        return true;
    }

    getLastMessageId(conversationId: number): number {
        let l = this.messagesCache[conversationId].messages.length;
        return this.messagesCache[conversationId].messages[l - 1].id;
    }

    getLastDialogMessageId(): number {
        if (this.dialogsCache.dialogs.length === 0) return null;
        return this.dialogsCache.dialogs[this.dialogsCache.dialogs.length - 1].message.id;
    }

    getHistory(conversationId: number, count: number = 0): HistoryInfo {
        let h = this.messagesCache[conversationId];
        if (count && h && h.messages && h.messages.length) {
            h.messages = h.messages.slice(0, count);
        }
        if (!h) {
            h = new HistoryInfo();
        }
        return h;
    }

    getMessagesCount(conversationId: number): number {
        let h = this.messagesCache[conversationId];
        return h ? h.count : 0;
    }

    private updateHistory(history: HistoryInfo): void {
        let conversationId = history.conversationId;
        if (!this.messagesCache[conversationId]) this.messagesCache[conversationId] = new HistoryInfo();
        this.messagesCache[conversationId] = history;
    }

    private updateDialogs(dialogs: DialogListInfo): void {
        console.log("update dialogs");
        this.dialogsCache = dialogs;
    }

    private getMessageCache(message: SingleMessageInfo) {
        return message ? "" + message.id + message.isRead + message.out + message.date + message.userId : undefined;
    }
}