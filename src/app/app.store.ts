import { RouterState, routerReducer } from "@ngrx/router-store";
import { BreadcrumbItem, HistoryListInfo, ChatListInfo, DialogListInfo, UserListInfo } from "./datamodels";
import { breadcrumbReducer, historyReducer, userListReducer, dialogListReducer, chatListReducer, currentConversationIdReducer } from "./reducers";

export const appStore = {
    breadcrumbs: breadcrumbReducer,
    users: userListReducer,
    dialogs: dialogListReducer,
    chats: chatListReducer,
    history: historyReducer,
    currentConversationId: currentConversationIdReducer,
    router: routerReducer
};

export class AppStore {
    breadcrumbs: BreadcrumbItem[];
    users: UserListInfo;
    dialogs: DialogListInfo;
    chats: ChatListInfo;
    history: HistoryListInfo;
    currentConversationId: number;
    router: RouterState;
}

export const INITIAL_APP_STATE = {
    breadcrumbs: [],
    users: new UserListInfo(),
    dialogs: new DialogListInfo(),
    chats: new ChatListInfo(),
    history: new HistoryListInfo(),
    currentConversationId: -1,
    router: { path: "/dialogs" }
};

export function stateFactory() {
    return JSON.parse(localStorage.getItem("savedState")) || INITIAL_APP_STATE;
};

export { BreadcrumbActions, HistoryActions, UserListActions, DialogListActions, ChatListActions, CurrentConversationIdActions } from "./reducers";