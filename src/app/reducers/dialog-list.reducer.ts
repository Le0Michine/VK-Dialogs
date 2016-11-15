import { ActionReducer, Action } from "@ngrx/store";

import { DialogListInfo } from "../datamodels";

export class DialogListActions {
    static UPDATE = "DIALOGS_UPDATE";
}

export function dialogListReducer (state: DialogListInfo, action: Action): DialogListInfo {
    switch (action.type) {
        case DialogListActions.UPDATE:
            return action.payload;
        default:
            return state;
    };
};