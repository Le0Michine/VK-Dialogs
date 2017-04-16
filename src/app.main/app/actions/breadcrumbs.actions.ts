import { Action } from '@ngrx/store';

import { BreadcrumbActions } from '../reducers';
import { BreadcrumbItem } from '../datamodels';

export function updateBreadcrumbs(breadcrumbs: BreadcrumbItem[]): Action {
    return { type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: breadcrumbs };
}
