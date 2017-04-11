import { ActionReducer, Action } from '@ngrx/store';

import { DialogListInfo, DialogInfo } from '../datamodels';

export class DialogListActions {
    static DIALOGS_LOADED = 'DIALOGS_LOADED';
    static DIALOGS_UPDATED = 'DIALOGS_UPDATED';
    static DIALOGS_UPDATED_UNREAD = 'DIALOGS_UPDATED_UNREAD';
}

export function dialogListReducer (state: DialogListInfo, action: Action): DialogListInfo {
    switch (action.type) {
        case DialogListActions.DIALOGS_LOADED:
            return action.payload;
        case DialogListActions.DIALOGS_UPDATED:
            return mergeDialogs(state, action.payload);
        case DialogListActions.DIALOGS_UPDATED_UNREAD:
            return replaceDialogsUnread(state, action.payload);
        default:
            return state;
    };
};

function mergeDialogs (dialogList1: DialogListInfo, newDilogsList: DialogListInfo): DialogListInfo {
    const result = Object.assign({}, dialogList1, newDilogsList);

    result.dialogs = dialogList1.dialogs
        .filter(x => newDilogsList.dialogs.findIndex(d => d.message.peerId === x.message.peerId) === -1)
        .concat(newDilogsList.dialogs)
        .sort((d1, d2) => d1.message.date < d2.message.date ? 1 : -1);

    return result;
};

function replaceDialogsUnread(dialogList1: DialogListInfo, newDilogsList: DialogListInfo): DialogListInfo {
    if (isNaN(newDilogsList.unread)) {
        newDilogsList.unread = dialogList1.unread;
    }
    return newDilogsList;
};
