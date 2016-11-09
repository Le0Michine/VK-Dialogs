import { BreadcrumbItem, HistoryListInfo, ChatListInfo, DialogListInfo, UserListInfo } from "./datamodels";
import { breadcrumbReducer, historyReducer, userListReducer, dialogListReducer, chatListReducer, currentConversationIdReducer } from "./reducers";

export const appStore = {
    breadcrumbs: breadcrumbReducer,
    users: userListReducer,
    dialogs: dialogListReducer,
    chats: chatListReducer,
    history: historyReducer,
    currentConversationId: currentConversationIdReducer
};

export interface AppStore {
    breadcrumbs: BreadcrumbItem[];
    users: UserListInfo;
    dialogs: DialogListInfo;
    chats: ChatListInfo;
    history: HistoryListInfo;
    currentConversationId: number;
}

export const INITIAL_APP_STATE = {
    breadcrumbs: [],
    users: new UserListInfo(),
    dialogs: new DialogListInfo(),
    chats: new ChatListInfo(),
    history: new HistoryListInfo(),
    currentConversationId: -1
};

export { BreadcrumbActions, HistoryActions, UserListActions, DialogListActions, ChatListActions, CurrentConversationIdActions } from "./reducers";