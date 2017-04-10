import { ActionReducer, Action } from '@ngrx/store';

import { InputMessageInfo, InputMessageListInfo, InputMessageState } from '../datamodels';

export class InputMessageActions {
    static TYPE = 'MESSAGE/type';
    static UPDATE = 'MESSAGE/update';
}

export function inputMessageReducer (state: InputMessageListInfo, action: Action): InputMessageListInfo {
    switch (action.type) {
        case InputMessageActions.UPDATE:
            return action.payload;
        case InputMessageActions.TYPE:
            return updateMessageState(state, action.payload, InputMessageState.TYPING);
        default:
            return state;
    };
};

function updateMessageState(state: InputMessageListInfo, action: InputMessageInfo, messageState: InputMessageState): InputMessageListInfo {
    const newState = Object.assign({}, state);
    const message = newState.messages[action.peerId];
    if (!message) {
        newState.conversationIds.push(action.peerId);
    }
    newState.messages[action.peerId] = Object.assign({}, message, action, { state: messageState });
    return newState;
}
