import { ActionReducer, Action } from "@ngrx/store";

import { HistoryListInfo, HistoryInfo } from "../datamodels";

export class UnreadDialogsCountActions {
    static UPDATE = "UNREAD_DIALOGS_COUNT_UPDATE";
}

export const unreadDialogsCountReducer: ActionReducer<number> = (state: number, action: Action): number => {
    switch (action.type) {
        case UnreadDialogsCountActions.UPDATE:
            return action.payload;
        default:
            return state;
    };
};