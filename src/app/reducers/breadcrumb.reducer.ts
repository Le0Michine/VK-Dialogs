import { ActionReducer, Action } from "@ngrx/store";

import { BreadcrumbItem } from "../datamodels";

export class BreadcrumbActions {
    static BREADCRUMBS_UPDATED = "BREADCRUMBS_UPDATED";
}

export const breadcrumbReducer: ActionReducer<BreadcrumbItem[]> = (state: BreadcrumbItem[], action: Action): BreadcrumbItem[] => {
    switch (action.type) {
        case BreadcrumbActions.BREADCRUMBS_UPDATED:
            return action.payload;
        default:
            return state;
    };
};