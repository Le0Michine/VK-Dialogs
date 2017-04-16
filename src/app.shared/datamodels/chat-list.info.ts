import { ChatInfo } from './chat.info';

export class ChatListInfo {
    chatIds: number[];
    chats: { [id: number]: ChatInfo };

    constructor() {
        this.chats = {};
        this.chatIds = [];
    }
}
