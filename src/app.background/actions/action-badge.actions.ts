import { ActionReducer, Action } from "@ngrx/store";

import { ActionBadgeActions } from "../reducers";

export function setBadge(value: string): Action {
    return { type: ActionBadgeActions.UPDATE, payload: value };
}