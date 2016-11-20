import { ActionReducer, Action } from "@ngrx/store";

import { SessionInfo } from "../datamodels";

export class SessionActions {
    static UPDATE = "SESSION/update";
}

export function sessionReducer (state: SessionInfo, action: Action): SessionInfo {
    switch (action.type) {
        case SessionActions.UPDATE:
            return action.payload;
        default:
            return state;
    };
};