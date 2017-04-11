import { ActionReducer, Action } from '@ngrx/store';

import { DialogListActions } from '../reducers';
import { DialogListInfo } from '../datamodels';

export function updateDialogList(value: DialogListInfo): Action {
    return { type: DialogListActions.DIALOGS_UPDATED, payload: value };
}

export function updateDialogListUnread(value: DialogListInfo): Action {
    return { type: DialogListActions.DIALOGS_UPDATED_UNREAD, payload: value };
}
