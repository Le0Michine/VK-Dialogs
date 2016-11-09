import { DialogsInfo, UserInfo, ChatInfo, HistoryInfo } from "./datamodels";
import { dialogListReducer, usersReducer, chatsReducer, historyReducer } from "./reducers";

export const appBackgroundStore = {
    users: usersReducer,
    dialogs: dialogListReducer,
    chats: chatsReducer,
    history: historyReducer
};

export interface AppBackgroundStore {
    users: { [id: number]: UserInfo };
    dialogs: DialogsInfo[];
    chats: { [id: number]: ChatInfo };
    history: { [id: number]: HistoryInfo };
}

export { DialogListActions, UsersActions, ChatsActions, HistoryActions } from "./reducers";