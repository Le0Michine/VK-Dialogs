import { Action } from '@ngrx/store';

import { DialogListFilterActions } from '../reducers';
import { DialogListFilterInfo } from '../datamodels';

export function replaceDialogListFilter(filters: DialogListFilterInfo): Action {
    return { type: DialogListFilterActions.REPLACE, payload: filters };
}
