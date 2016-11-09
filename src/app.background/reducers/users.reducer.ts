import { ActionReducer, Action } from "@ngrx/Store";

import { UserInfo } from "../datamodels";

export class UsersActions {
    static USERS_LOADED = "DIALOGS_LOADED";
}

export const usersReducer: ActionReducer<{ [id: number]: UserInfo }> = (state: { [id: number]: UserInfo }, action: Action): { [id: number]: UserInfo } => {
    switch (action.type) {
        case UsersActions.USERS_LOADED:
            return action.payload;
        default:
            return state;
    };
};