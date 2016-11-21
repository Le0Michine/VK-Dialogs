import { combineReducers, Action } from "@ngrx/store";
import { compose } from "@ngrx/core/compose";
import { storeLogger } from "ngrx-store-logger";

import { DialogListInfo, UserListInfo, ChatListInfo, HistoryListInfo, InputMessageListInfo, SessionInfo } from "./datamodels";
import { dialogListReducer, usersReducer, chatsReducer, historyReducer, inputMessageReducer, authorizationReducer, actionBadgeReducer, sessionReducer } from "./reducers";

export const appBackgroundState = {
    users: usersReducer,
    dialogs: dialogListReducer,
    chats: chatsReducer,
    history: historyReducer,
    inputMessages: inputMessageReducer,
    actionBadge: actionBadgeReducer,
    isAuthorized: authorizationReducer,
    session: sessionReducer
};

export interface AppBackgroundState {
    users: UserListInfo;
    dialogs: DialogListInfo;
    chats: ChatListInfo;
    history: HistoryListInfo;
    inputMessages: InputMessageListInfo;
    actionBadge: string;
    isAuthorized: boolean;
    session: SessionInfo;
}

export const INITIAL_APP_STATE = {
    users: new UserListInfo(),
    dialogs: new DialogListInfo(),
    chats: new ChatListInfo(),
    history: new HistoryListInfo(),
    inputMessages: new InputMessageListInfo(),
    actionBadge: "",
    isAuthorized: false,
    session: null
};

export function appStateFactory() {
    return INITIAL_APP_STATE;
}

export function rootReducer (state: AppBackgroundState, action: Action){
  if (action.type === "SET_NEW_STATE") {
      state = Object.assign({}, state, action.payload);
  }
  return compose(storeLogger(), combineReducers)(appBackgroundState)(state, action);
}

export { DialogListActions, UsersActions, ChatsActions, HistoryActions, InputMessageActions } from "./reducers";