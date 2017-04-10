import { ActionReducer, Action } from '@ngrx/store';

import { DialogListInfo, DialogInfo } from '../datamodels';

export class DialogListActions {
    static DIALOGS_LOADED = 'DIALOGS_LOADED';
    static DIALOGS_UPDATED = 'DIALOGS_UPDATED';
}

export function dialogListReducer (state: DialogListInfo, action: Action): DialogListInfo {
    switch (action.type) {
        case DialogListActions.DIALOGS_LOADED:
            return action.payload;
        case DialogListActions.DIALOGS_UPDATED:
            return mergeDialogs(state, action.payload);
        default:
            return state;
    };
};

function mergeDialogs (dialogList1: DialogListInfo, dialogList2: DialogListInfo): DialogListInfo {
    const result = Object.assign({}, dialogList1, dialogList2);

    result.dialogs = dialogList1.dialogs
        .filter(x => dialogList2.dialogs.findIndex(d => d.message.peerId === x.message.peerId) === -1)
        .concat(dialogList2.dialogs)
        .sort((d1, d2) => d1.message.date < d2.message.date ? 1 : -1);

    return result;
};
