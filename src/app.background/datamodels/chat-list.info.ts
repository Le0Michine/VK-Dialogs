import { ChatInfo } from "./";

export class ChatListInfo {
    chatIds: number[];
    chats: { [id: number]: ChatInfo };

    constructor() {
        this.chats = {};
        this.chatIds = [];
    }
}