import { combineReducers, Action } from "@ngrx/store";
import { compose } from "@ngrx/core/compose";
import { RouterState, routerReducer } from "@ngrx/router-store";
import { storeLogger } from "ngrx-store-logger";
import { generateDemoData } from "./demo-data.generator";

import { BreadcrumbItem, HistoryListInfo, ChatListInfo, DialogListInfo, UserListInfo, InputMessageListInfo } from "../app/datamodels";
import { breadcrumbReducer, historyReducer, userListReducer, dialogListReducer, chatListReducer, currentConversationIdReducer, inputMessageReducer } from "../app/reducers";

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
  return compose(storeLogger(), combineReducers)(appState)(state, action);
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

export function stateFactory() {
    return  generateDemoData();
};

export { BreadcrumbActions, HistoryActions, UserListActions, DialogListActions, ChatListActions, CurrentConversationIdActions } from "../app/reducers";