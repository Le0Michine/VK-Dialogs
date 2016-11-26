import { combineReducers, Action } from "@ngrx/store";
import { compose } from "@ngrx/core/compose";
import { RouterState, routerReducer } from "@ngrx/router-store";
import { storeLogger } from "ngrx-store-logger";

import { BreadcrumbItem, HistoryListInfo, ChatListInfo, DialogListInfo, UserListInfo, InputMessageListInfo } from "./datamodels";
import { breadcrumbReducer, historyReducer, userListReducer, dialogListReducer, chatListReducer, currentConversationIdReducer, inputMessageReducer } from "./reducers";

export const appState = {
    breadcrumbs: breadcrumbReducer,
    users: userListReducer,
    dialogs: dialogListReducer,
    chats: chatListReducer,
    history: historyReducer,
    currentConversationId: currentConversationIdReducer,
    router: routerReducer,
    inputMessages: inputMessageReducer
};

export function rootReducer (state: AppState, action: Action){
  if (action.type === "SET_NEW_STATE") {
    state = Object.assign({}, state, action.payload);
  }
  if (!process.env.PRODUCTION) {
    return compose(storeLogger(), combineReducers)(appState)(state, action);
  } else {
    return compose(combineReducers)(appState)(state, action);
  }
}

export class AppState {
    breadcrumbs: BreadcrumbItem[];
    users: UserListInfo;
    dialogs: DialogListInfo;
    chats: ChatListInfo;
    history: HistoryListInfo;
    currentConversationId: number;
    router: RouterState;
    inputMessages: InputMessageListInfo;
}

export const INITIAL_APP_STATE = {
    breadcrumbs: [],
    users: new UserListInfo(),
    dialogs: new DialogListInfo(),
    chats: new ChatListInfo(),
    history: new HistoryListInfo(),
    currentConversationId: -1,
    router: { path: "/dialogs" },
    inputMessages: new InputMessageListInfo()
};

export function stateFactory() {
    return /*JSON.parse(localStorage.getItem("savedState")) ||*/ INITIAL_APP_STATE;
};

export { BreadcrumbActions, HistoryActions, UserListActions, DialogListActions, ChatListActions, CurrentConversationIdActions } from "./reducers";