import { ActionReducer, Action } from "@ngrx/store";

export class ActionBadgeActions {
    static UPDATE = "BADGE/update";
}

export function actionBadgeReducer (state: string, action: Action): string {
    switch (action.type) {
        case ActionBadgeActions.UPDATE:
            return action.payload + "";
        default:
            return state;
    };
};