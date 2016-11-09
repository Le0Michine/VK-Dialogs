import { ActionReducer, Action } from "@ngrx/Store";

import { ChatInfo, ChatListInfo } from "../datamodels";

export class ChatsActions {
    static CHATS_LOADED = "CHATS_LOADED";
    static CHATS_UPDATED = "CHATS_UPDATED";
}

export const chatsReducer: ActionReducer<ChatListInfo> = (state: ChatListInfo, action: Action): ChatListInfo => {
    switch (action.type) {
        case ChatsActions.CHATS_LOADED:
            let newChatList = new ChatListInfo();
            newChatList.chatIds = action.payload.map((c: ChatInfo) => c.id);
            action.payload.forEach((c: ChatInfo) => newChatList.chats[c.id] = c);
            return newChatList;
        case ChatsActions.CHATS_UPDATED:
            let updatedChatList = Object.assign({}, state);
            updatedChatList.chatIds = updatedChatList.chatIds.concat(
                action.payload
                    .map((c: ChatInfo) => c.id)
                    .filter(id => updatedChatList.chatIds.indexOf(id) === -1));
            action.payload.forEach((c: ChatInfo) => updatedChatList.chats[c.id] = c);
            return updatedChatList;
        default:
            return state;
    };
};