import { DialogListInfo, UserListInfo, ChatListInfo, HistoryListInfo } from "./datamodels";
import { dialogListReducer, usersReducer, chatsReducer, historyReducer } from "./reducers";

export const appBackgroundState = {
    users: usersReducer,
    dialogs: dialogListReducer,
    chats: chatsReducer,
    history: historyReducer
};

export interface AppBackgroundState {
    users: UserListInfo;
    dialogs: DialogListInfo;
    chats: ChatListInfo;
    history: HistoryListInfo;
}

export const INITIAL_APP_STATE = {
    users: new UserListInfo(),
    dialogs: new DialogListInfo(),
    chats: new ChatListInfo(),
    history: new HistoryListInfo()
};

export function appStateFactory() {
    return INITIAL_APP_STATE;
}

export { DialogListActions, UsersActions, ChatsActions, HistoryActions } from "./reducers";