import { ActionReducer, Action } from '@ngrx/store';

import { DialogListFilterInfo } from '../datamodels';

export class DialogListFilterActions {
    static REPLACE = 'DIALOG_LIST_FILTER/replace';
    static SET_UNREAD = 'DIALOG_LIST_FILTER/set unread';
    static SET_IMPORTANT = 'DIALOG_LIST_FILTER/set important';
    static SET_UNANSWERED = 'DIALOG_LIST_FILTER/set ananswered';
    static SET_PINNED = 'DIALOG_LIST_FILTER/set pinned';
}

export function dialogListFilterReducer (state: DialogListFilterInfo, action: Action): DialogListFilterInfo {
    switch (action.type) {
        case DialogListFilterActions.REPLACE:
            return Object.assign({}, state, action.payload);
        case DialogListFilterActions.SET_UNREAD:
            return Object.assign({}, state, { unread: !!action.payload });
        case DialogListFilterActions.SET_IMPORTANT:
            return Object.assign({}, state, { important: !!action.payload });
        case DialogListFilterActions.SET_UNANSWERED:
            return Object.assign({}, state, { unanswered: !!action.payload });
        case DialogListFilterActions.SET_PINNED:
            return Object.assign({}, state, { pinned: !!action.payload });
        default:
            return state;
    };
}
