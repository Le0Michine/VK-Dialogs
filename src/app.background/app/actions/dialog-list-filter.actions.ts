import { ActionReducer, Action } from '@ngrx/store';

import { DialogListFilterActions } from '../reducers';
import { DialogListFilterInfo } from '../datamodels';

export function updateDialogListFilter(value: DialogListFilterInfo): Action {
    return { type: DialogListFilterActions.UPDATE_ALL, payload: value };
}
