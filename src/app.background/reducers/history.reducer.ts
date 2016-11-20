import { ActionReducer, Action } from "@ngrx/store";

import { HistoryListInfo, HistoryInfo, InputMessageState } from "../datamodels";

export class HistoryActions {
    static HISTORY_LOADED = "HISTORY/replace";
    static HISTORY_UPDATED = "HISTORY/update";
    static TYPE_MESSAGE = "HISTORY/type message";
    static SEND_MESSAGE_PENDING = "HISTORY/sending message";
    static SEND_MESSAGE_SUCCESS = "HISTORY/message sent";
}

export function historyReducer (state: HistoryListInfo, action: Action): HistoryListInfo {
    switch (action.type) {
        case HistoryActions.HISTORY_LOADED:
            return replaceHistory(state, action);
        case HistoryActions.HISTORY_UPDATED:
            return updateHistory(state, action);
        default:
            return state;
    };
};

function replaceHistory(state: HistoryListInfo, action: Action): HistoryListInfo {
    let newHistory = new HistoryListInfo();
    newHistory.conversationIds.push(action.payload.conversationId);
    newHistory.history[action.payload.conversationId] = action.payload;
    return newHistory;
}

function updateHistory(state: HistoryListInfo, action: Action): HistoryListInfo {
    let updatedHistory = Object.assign(new HistoryListInfo(), state);
    let id = action.payload.conversationId;
    if (!updatedHistory.history[id]) {
        updatedHistory.conversationIds.push(id);
        updatedHistory.history[id] = action.payload;
    }
    else {
        updatedHistory.history[id] = mergeHistory(state.history[id], action.payload);
    }
    return updatedHistory;
}

function mergeHistory(history1: HistoryInfo, history2: HistoryInfo): HistoryInfo {
    let result = Object.assign(new HistoryInfo(), history1);
    let newIdHead = history2.messages[0].id;
    let newIdTail = history2.messages[history2.messages.length - 1].id;

    let oldHead = history1.messages.findIndex(x => x.id === newIdHead);
    let oldTail = history1.messages.findIndex(x => x.id === newIdTail);

    if (oldHead === -1 && oldTail === -1) {
        result.messages = history2.messages;
    } else if (oldHead > -1 && oldTail > -1) {
        result.messages = history1.messages.slice(0, oldHead).concat(history2.messages).concat(history1.messages.slice(oldTail + 1));
    } else if (oldHead > -1) {
        result.messages = history1.messages.slice(0, oldHead).concat(history2.messages);
    } else { // if (oldTail > -1)
        result.messages = history2.messages.concat(history1.messages.slice(oldTail + 1));
    }
    return result;
}