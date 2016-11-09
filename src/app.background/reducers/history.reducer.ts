import { ActionReducer, Action } from "@ngrx/Store";

import { HistoryInfo } from "../datamodels";

export class HistoryActions {
    static HISTORY_LOADED = "HISTORY_LOADED";
}

export const historyReducer: ActionReducer<{ [id: number]: HistoryInfo }> = (state: { [id: number]: HistoryInfo }, action: Action): { [id: number]: HistoryInfo } => {
    switch (action.type) {
        case HistoryActions.HISTORY_LOADED:
            return action.payload;
        default:
            return state;
    };
};