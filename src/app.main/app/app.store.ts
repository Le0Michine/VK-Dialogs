import { combineReducers, Action } from '@ngrx/store';
import { compose } from '@ngrx/core/compose';
import { RouterState, routerReducer } from '@ngrx/router-store';
import { storeLogger } from 'ngrx-store-logger';

import { environment } from '../../environments/environment';
import { DialogListFilterInfo, BreadcrumbItem, HistoryListInfo, ChatListInfo, DialogListInfo, UserListInfo, InputMessageListInfo } from './datamodels';
// tslint:disable-next-line:max-line-length
import { dialogListFilterReducer, breadcrumbReducer, historyReducer, userListReducer, dialogListReducer, chatListReducer, currentConversationIdReducer, inputMessageReducer } from './reducers';

export const appState = {
    breadcrumbs: breadcrumbReducer,
    users: userListReducer,
    dialogs: dialogListReducer,
    chats: chatListReducer,
    history: historyReducer,
    currentConversationId: currentConversationIdReducer,
    router: routerReducer,
    inputMessages: inputMessageReducer,
    dialogsFilter: dialogListFilterReducer
};

export function rootReducer (state: AppState, action: Action) {
  if (action.type === 'SET_NEW_STATE') {
    state = Object.assign({}, state, action.payload);
  }
  if (!environment.production) {
    return compose(storeLogger(), combineReducers)(appState)(state, action);
  } else {
    return compose(combineReducers)(appState)(state, action);
  }
}

export interface AppState {
    breadcrumbs: BreadcrumbItem[];
    users: UserListInfo;
    dialogs: DialogListInfo;
    chats: ChatListInfo;
    history: HistoryListInfo;
    currentConversationId: number;
    router: RouterState;
    inputMessages: InputMessageListInfo;
    dialogsFilter: DialogListFilterInfo;
}

export const INITIAL_APP_STATE: AppState = {
    breadcrumbs: [],
    users: { userIds: [], users: {} } as UserListInfo,
    dialogs: { dialogs: [] } as DialogListInfo,
    chats: { chatIds: [], chats: {} } as ChatListInfo,
    history: { conversationIds: [], history: {} } as HistoryListInfo,
    currentConversationId: -1,
    router: { path: '/dialogs' },
    inputMessages: { conversationIds: [], messages: {} } as InputMessageListInfo,
    dialogsFilter: {} as DialogListFilterInfo
};

export function stateFactory() {
    return /*JSON.parse(localStorage.getItem("savedState")) ||*/ INITIAL_APP_STATE;
};

// tslint:disable-next-line:max-line-length
export { BreadcrumbActions, HistoryActions, UserListActions, DialogListActions, ChatListActions, CurrentConversationIdActions } from './reducers';
