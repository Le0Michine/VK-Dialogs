import { ActionReducer, Action } from "@ngrx/store";

import { InputMessageInfo, InputMessageListInfo, InputMessageState } from "../datamodels";

export class InputMessageActions {
    static TYPE = "MESSAGE/type";
    static UPDATE = "MESSAGE/update";
}

export function inputMessageReducer (state: InputMessageListInfo, action: Action): InputMessageListInfo {
    switch (action.type) {
        case InputMessageActions.UPDATE:
            return action.payload;
        case InputMessageActions.TYPE:
            return updateMessageState(state, action, InputMessageState.TYPING);
        default:
            return state;
    };
};

function updateMessageState(state: InputMessageListInfo, action: Action, messageState: InputMessageState): InputMessageListInfo {
    let newState = Object.assign({}, state);
    let message = newState.messages[action.payload.conversationId];
    if (!message) {
        newState.conversationIds.push(action.payload.conversationId);
    }
    newState.messages[action.payload.conversationId] = Object.assign({}, message, action.payload, { state: messageState });
    return newState;
}