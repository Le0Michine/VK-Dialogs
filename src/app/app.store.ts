import { BreadcrumbItem } from "./datamodels";
import { breadcrumbReducer } from "./reducers";

export const appStore = {
    breadcrumbs: breadcrumbReducer
};

export interface AppStore {
    breadcrumbs: BreadcrumbItem[];
}