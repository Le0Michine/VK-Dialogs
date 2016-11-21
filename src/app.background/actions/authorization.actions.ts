import { ActionReducer, Action } from "@ngrx/store";

import { AuthorizationActions } from "../reducers";

export function login(): Action {
    return { type: AuthorizationActions.LOGIN, payload: null };
}

export function logoff(): Action {
    return { type: AuthorizationActions.LOGOFF, payload: null };
}