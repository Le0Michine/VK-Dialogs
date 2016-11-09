import { ActionReducer, Action } from "@ngrx/Store";

import { DialogsInfo } from "../datamodels";

export class DialogListActions {
    static DIALOGS_LOADED = "DIALOGS_LOADED";
}

export const dialogListReducer: ActionReducer<DialogsInfo> = (state: DialogsInfo, action: Action): DialogsInfo => {
    switch (action.type) {
        case DialogListActions.DIALOGS_LOADED:
            return action.payload;
        default:
            return state;
    };
};