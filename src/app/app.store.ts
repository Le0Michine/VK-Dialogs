import { BreadcrumbItem, HistoryInfo } from "./datamodels";
import { breadcrumbReducer, historyReducer } from "./reducers";
import { BreadcrumbActions, HistoryActions } from "./reducers";

export const appStore = {
    breadcrumbs: breadcrumbReducer,
    history: historyReducer
};

export interface AppStore {
    breadcrumbs: BreadcrumbItem[];
    history: HistoryInfo;
}

export { BreadcrumbActions, HistoryActions };