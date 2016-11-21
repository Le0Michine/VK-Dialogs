import { Action } from "@ngrx/store";

import { InputMessageActions } from "../reducers";
import { InputMessageInfo, InputMessageListInfo } from "../datamodels";

export function replaceMessage(message: InputMessageListInfo): Action {
    return { type: InputMessageActions.UPDATE, payload: message };
}

export function typeMessage(message: InputMessageInfo): Action {
    return { type: InputMessageActions.TYPE, payload: message };
}