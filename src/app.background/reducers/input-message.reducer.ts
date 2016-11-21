import { ActionReducer, Action } from "@ngrx/store";

import { InputMessageState, InputMessageInfo, InputMessageListInfo } from "../datamodels";

export class InputMessageActions {
    static TYPE_MESSAGE = "INPUT_MESSAGE/type message";
    static SEND_MESSAGE_PENDING = "INPUT_MESSAGE/sending message";
    static SEND_MESSAGE_SUCCESS = "INPUT_MESSAGE/message sent";
    static SEND_MESSAGE_FAIL = "INPUT_MESSAGE/message sending failed";
    static RESTORE = "INPUT_MESSAGE/restore";
}

export function inputMessageReducer (state: InputMessageListInfo, action: Action): InputMessageListInfo {
    switch (action.type) {
        case InputMessageActions.RESTORE:
            let newState = new InputMessageListInfo();
            newState.conversationIds = action.payload.map(m => m.conversationId);
            action.payload.forEach(m => newState.messages[m.conversationId] = m);
            return newState;
        case InputMessageActions.TYPE_MESSAGE:
            return typeMessage(state, action);
        case InputMessageActions.SEND_MESSAGE_PENDING:
            return sendMessagePending(state, action);
        case InputMessageActions.SEND_MESSAGE_SUCCESS:
            return sendMessageSuccess(state, action);
        case InputMessageActions.SEND_MESSAGE_FAIL:
            return sendMessageFail(state, action);
        default:
            return state;
    };
};

function sendMessageFail(state: InputMessageListInfo, action: Action): InputMessageListInfo {
    let newState = Object.assign({}, state);
    let message = state.messages[action.payload.conversationId];
    newState.messages[action.payload.conversationId] = Object.assign({}, message, { state: InputMessageState.FAIL });
    return newState;
}

function sendMessageSuccess(state: InputMessageListInfo, action: Action): InputMessageListInfo {
    let newState = Object.assign({}, state);
    let message = state.messages[action.payload.conversationId];
    newState.messages[action.payload.conversationId] = Object.assign({}, message, { state: InputMessageState.SENT, attachments: [] });
    return newState;
}

function sendMessagePending(state: InputMessageListInfo, action: Action): InputMessageListInfo {
    let newState = Object.assign({}, state);
    let message = state.messages[action.payload.conversationId];
    newState.messages[action.payload.conversationId] = Object.assign({}, message, action.payload, { state: InputMessageState.SENDING });
    return newState;
}

function typeMessage(state: InputMessageListInfo, action: Action): InputMessageListInfo {
    let newState = Object.assign({}, state);
    let message = state.messages[action.payload.conversationId];
    if (!message || newState.conversationIds.indexOf(action.payload.conversationId) === -1) {
        newState.conversationIds.push(action.payload.conversationId);
    }
    state.messages[action.payload.conversationId] = Object.assign({}, message, action.payload, { state: InputMessageState.TYPING });
    return newState;
}