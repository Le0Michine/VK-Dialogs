import { ActionReducer, Action } from "@ngrx/store";

import { InputMessageState, InputMessageInfo, InputMessageListInfo } from "../datamodels";
import { InputMessageActions } from "../reducers";

export function typeMessage(message: InputMessageInfo): Action {
    return { type: InputMessageActions.TYPE_MESSAGE, payload: message };
}

export function sendMessagePending(message: InputMessageInfo): Action {
    return { type: InputMessageActions.SEND_MESSAGE_PENDING, payload: message };
}

export function sendMessageSuccess(id: number): Action {
    return { type: InputMessageActions.SEND_MESSAGE_SUCCESS, payload: { conversationId: id } };
}

export function sendMessageFail(id: number): Action {
    return { type: InputMessageActions.SEND_MESSAGE_FAIL, payload: { conversationId: id } };
}

export function restoreInputMessages(messages: InputMessageInfo[]): Action {
    return { type: InputMessageActions.RESTORE, payload: messages.filter(m => Boolean(m.conversationId)) };
}