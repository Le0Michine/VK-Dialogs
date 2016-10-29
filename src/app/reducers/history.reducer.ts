import { ActionReducer, Action } from "@ngrx/Store";

import { HistoryInfo } from "../datamodels";

export class HistoryActions {
    static HISTORY_LOADED = "HISTORY_LOADED";
}

export const historyReducer: ActionReducer<HistoryInfo> = (state: HistoryInfo, action: Action): HistoryInfo => {
    switch (action.type) {
        case HistoryActions.HISTORY_LOADED:
            return action.payload;
        default:
            return state;
    };
};