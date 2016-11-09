import { ActionReducer, Action } from "@ngrx/Store";

import { HistoryListInfo, HistoryInfo } from "../datamodels";

export class HistoryActions {
    static HISTORY_LOADED = "HISTORY_LOADED";
    static HISTORY_UPDATED = "HISTORY_UPDATED";
}

export const historyReducer: ActionReducer<HistoryListInfo> = (state: HistoryListInfo, action: Action): HistoryListInfo => {
    switch (action.type) {
        case HistoryActions.HISTORY_LOADED:
            let newHistory = new HistoryListInfo();
            newHistory.conversationIds.push(action.payload.conversationId);
            newHistory.history[action.payload.conversationId] = action.payload;
            return newHistory;
        case HistoryActions.HISTORY_UPDATED:
            let updatedHistory = Object.assign({}, state);
            let id = action.payload.conversationId;
            if (!updatedHistory.history[id]) {
                updatedHistory.conversationIds.push(id);
                updatedHistory.history[id] = action.payload;
            }
            else {
                updatedHistory.history[id] = mergeHistory(updatedHistory.history[id], action.payload);
            }

            return updatedHistory;
        default:
            return state;
    };
};

function mergeHistory(history1: HistoryInfo, history2: HistoryInfo): HistoryInfo {
    let result = Object.assign({}, history1);
    result.messages = history1.messages.concat(history2.messages);
    return result;
}