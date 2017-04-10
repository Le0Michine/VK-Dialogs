import { ActionReducer, Action } from '@ngrx/store';

import { InputMessageState, InputMessageInfo, InputMessageListInfo } from '../datamodels';

export class InputMessageActions {
    static TYPE_MESSAGE = 'INPUT_MESSAGE/type message';
    static SEND_MESSAGE_PENDING = 'INPUT_MESSAGE/sending message';
    static SEND_MESSAGE_SUCCESS = 'INPUT_MESSAGE/message sent';
    static SEND_MESSAGE_FAIL = 'INPUT_MESSAGE/message sending failed';
    static RESTORE = 'INPUT_MESSAGE/restore';
}

export function inputMessageReducer (state: InputMessageListInfo, action: Action): InputMessageListInfo {
    switch (action.type) {
        case InputMessageActions.RESTORE:
            const newState = new InputMessageListInfo();
            newState.conversationIds = action.payload.map(m => m.peerId);
            action.payload.forEach(m => newState.messages[m.peerId] = m);
            return newState;
        case InputMessageActions.TYPE_MESSAGE:
            return typeMessage(state, action.payload);
        case InputMessageActions.SEND_MESSAGE_PENDING:
            return sendMessagePending(state, action.payload);
        case InputMessageActions.SEND_MESSAGE_SUCCESS:
            return sendMessageSuccess(state, action.payload);
        case InputMessageActions.SEND_MESSAGE_FAIL:
            return sendMessageFail(state, action.payload);
        default:
            return state;
    };
};

function sendMessageFail(state: InputMessageListInfo, action: InputMessageInfo): InputMessageListInfo {
    const newState = Object.assign({}, state);
    const message = state.messages[action.peerId];
    newState.messages[action.peerId] = Object.assign({}, message, { state: InputMessageState.FAIL });
    return newState;
}

function sendMessageSuccess(state: InputMessageListInfo, action: InputMessageInfo): InputMessageListInfo {
    const newState = Object.assign({}, state);
    const message = state.messages[action.peerId];
    newState.messages[action.peerId] = Object.assign({}, message, { state: InputMessageState.SENT, attachments: [] });
    return newState;
}

function sendMessagePending(state: InputMessageListInfo, action: InputMessageInfo): InputMessageListInfo {
    const newState = Object.assign({}, state);
    const message = state.messages[action.peerId];
    newState.messages[action.peerId] = Object.assign({}, message, action, { state: InputMessageState.SENDING });
    return newState;
}

function typeMessage(state: InputMessageListInfo, action: InputMessageInfo): InputMessageListInfo {
    const newState = Object.assign({}, state);
    const message = state.messages[action.peerId];
    if (!message || newState.conversationIds.indexOf(action.peerId) === -1) {
        newState.conversationIds.push(action.peerId);
    }
    state.messages[action.peerId] = Object.assign({}, message, action, { state: InputMessageState.TYPING });
    return newState;
}
