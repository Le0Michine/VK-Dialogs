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

export interface AppStore {
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
    // router: { path: "/dialogs" }
    router: { path: "/dialogs/dialog/6807492/%D0%90%D0%BB%D1%91%D0%BD%D0%B0%20%D0%9C%D0%B8%D1%88%D0%B8%D0%BD%D0%B0" }
};

export { BreadcrumbActions, HistoryActions, UserListActions, DialogListActions, ChatListActions, CurrentConversationIdActions } from "./reducers";