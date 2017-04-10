import { ActionReducer, Action } from '@ngrx/store';

import { HistoryListInfo, HistoryInfo, InputMessageState } from '../datamodels';

export class HistoryActions {
    static HISTORY_LOADED = 'HISTORY/replace';
    static HISTORY_UPDATED = 'HISTORY/update';
    static TYPE_MESSAGE = 'HISTORY/type message';
    static SEND_MESSAGE_PENDING = 'HISTORY/sending message';
    static SEND_MESSAGE_SUCCESS = 'HISTORY/message sent';
}

export function historyReducer (state: HistoryListInfo, action: Action): HistoryListInfo {
    switch (action.type) {
        case HistoryActions.HISTORY_LOADED:
            return replaceHistory(state, action.payload);
        case HistoryActions.HISTORY_UPDATED:
            return updateHistory(state, action.payload);
        default:
            return state;
    };
};

function replaceHistory(state: HistoryListInfo, action: HistoryInfo): HistoryListInfo {
    const newHistory = new HistoryListInfo();
    newHistory.conversationIds.push(action.peerId);
    newHistory.history[action.peerId] = action;
    return newHistory;
}

function updateHistory(state: HistoryListInfo, action: HistoryInfo): HistoryListInfo {
    const updatedHistory = Object.assign({}, state) as HistoryListInfo;
    const id = action.peerId;
    if (!updatedHistory.history[id]) {
        updatedHistory.conversationIds.push(id);
        updatedHistory.history[id] = action;
    } else {
        updatedHistory.history[id] = mergeHistory(state.history[id], action);
    }
    return updatedHistory;
}

function mergeHistory(history1: HistoryInfo, history2: HistoryInfo): HistoryInfo {
    const result = Object.assign({}, history1);
    const newIdHead = history2.messages[0].id;
    const newIdTail = history2.messages[history2.messages.length - 1].id;

    const oldHead = history1.messages.findIndex(x => x.id === newIdHead);
    const oldTail = history1.messages.findIndex(x => x.id === newIdTail);

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
