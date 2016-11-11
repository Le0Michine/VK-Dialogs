import { ActionReducer, Action } from "@ngrx/store";

import { BreadcrumbItem } from "../datamodels";

export class CurrentConversationIdActions {
    static UPDATED = "CURRENT_CONVERSATION_ID_UPDATED";
}

export const currentConversationIdReducer: ActionReducer<number> = (state: number, action: Action): number => {
    switch (action.type) {
        case CurrentConversationIdActions.UPDATED:
            return action.payload;
        default:
            return state;
    };
};