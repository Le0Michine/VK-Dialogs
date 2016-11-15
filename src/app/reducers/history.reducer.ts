import { ActionReducer, Action } from "@ngrx/store";

import { HistoryListInfo } from "../datamodels";

export class HistoryActions {
    static UPDATE = "HISTORY_UPDATE";
}

export function historyReducer (state: HistoryListInfo, action: Action): HistoryListInfo {
    switch (action.type) {
        case HistoryActions.UPDATE:
            return action.payload;
        default:
            return state;
    };
};