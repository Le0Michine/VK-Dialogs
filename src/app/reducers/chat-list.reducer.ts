import { ActionReducer, Action } from "@ngrx/store";

import { ChatListInfo } from "../datamodels";

export class ChatListActions {
    static UPDATE = "CHATS_UPDATE";
}

export function chatListReducer (state: ChatListInfo, action: Action): ChatListInfo {
    switch (action.type) {
        case ChatListActions.UPDATE:
            return action.payload;
        default:
            return state;
    };
};