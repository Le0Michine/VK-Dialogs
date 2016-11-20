import { ActionReducer, Action } from "@ngrx/store";

import { SessionInfo } from "../datamodels";
import { SessionActions } from "../reducers";

export function setSession(session: SessionInfo): Action {
    return { type: SessionActions.UPDATE, payload: session };
}