import { ActionReducer, Action } from "@ngrx/store";

import { UserListInfo, UserInfo } from "../datamodels";

export class UsersActions {
    static USERS_LOADED = "USERS_LOADED";
    static USERS_UPDATED = "USERS_UPDATED";
}

export function usersReducer (state: UserListInfo, action: Action): UserListInfo {
    switch (action.type) {
        // payload -- UserInfo[]
        case UsersActions.USERS_LOADED:
            let newState = new UserListInfo();
            action.payload.forEach((user: UserInfo) => {
                newState.users[user.id] = user;
                newState.userIds.push(user.id);
            });
            return newState;
        case UsersActions.USERS_UPDATED:
            let updatedState = Object.assign({}, state);
            action.payload.forEach((user: UserInfo) => {
                if (!updatedState.users[user.id]) {
                    updatedState.userIds.push(user.id);
                }
                updatedState.users[user.id] = user;
            });
            return updatedState;
        default:
            return state;
    };
};