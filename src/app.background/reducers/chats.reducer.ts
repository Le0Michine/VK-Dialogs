import { ActionReducer, Action } from "@ngrx/Store";

import { ChatInfo } from "../datamodels";

export class ChatsActions {
    static CHATS_LOADED = "CHATS_LOADED";
}

export const chatsReducer: ActionReducer<{ [id: number]: ChatInfo }> = (state: { [id: number]: ChatInfo }, action: Action): { [id: number]: ChatInfo } => {
    switch (action.type) {
        case ChatsActions.CHATS_LOADED:
            return action.payload;
        default:
            return state;
    };
};