import { ActionReducer, Action } from "@ngrx/store";

import { UserListInfo } from "../datamodels";

export class UserListActions {
    static UPDATE = "USERS_UPDATE";
}

export function userListReducer (state: UserListInfo, action: Action): UserListInfo {
    switch (action.type) {
        case UserListActions.UPDATE:
            return action.payload;
        default:
            return state;
    };
};