import { ActionReducer, Action } from "@ngrx/store";

export class AuthorizationActions {
    static LOGIN = "AUTHORIZATION/login";
    static LOGOFF = "AUTHORIZATION/log off";
}

export function authorizationReducer (state: boolean, action: Action): boolean {
    switch (action.type) {
        case AuthorizationActions.LOGIN:
            return true;
        case AuthorizationActions.LOGOFF:
            return false;
        default:
            return state;
    };
};