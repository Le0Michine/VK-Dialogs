import { ActionReducer, Action } from "@ngrx/Store";

import { DialogListInfo } from "../datamodels";

export class DialogListActions {
    static UPDATE = "DIALOGS_UPDATE";
}

export const dialogListReducer: ActionReducer<DialogListInfo> = (state: DialogListInfo, action: Action): DialogListInfo => {
    switch (action.type) {
        case DialogListActions.UPDATE:
            return action.payload;
        default:
            return state;
    };
};