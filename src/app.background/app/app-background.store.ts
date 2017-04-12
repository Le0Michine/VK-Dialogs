import { combineReducers, Action } from '@ngrx/store';
import { compose } from '@ngrx/core/compose';
import { storeLogger } from 'ngrx-store-logger';
import { environment } from '../../environments/environment';

// tslint:disable-next-line:max-line-length
import { DialogListFilterInfo, DialogListInfo, UserListInfo, ChatListInfo, HistoryListInfo, InputMessageListInfo, SessionInfo } from './datamodels';
// tslint:disable-next-line:max-line-length
import { dialogListFilterReducer, dialogListReducer, usersReducer, chatsReducer, historyReducer, inputMessageReducer, authorizationReducer, actionBadgeReducer, sessionReducer } from './reducers';

export const appBackgroundState = {
    users: usersReducer,
    dialogs: dialogListReducer,
    chats: chatsReducer,
    history: historyReducer,
    inputMessages: inputMessageReducer,
    actionBadge: actionBadgeReducer,
    isAuthorized: authorizationReducer,
    session: sessionReducer,
    dialogsFilter: dialogListFilterReducer
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
    dialogsFilter: DialogListFilterInfo;
}

export const INITIAL_APP_STATE: AppBackgroundState = {
    users: { userIds: [], users: {} } as UserListInfo,
    dialogs: { dialogs: [] } as DialogListInfo,
    chats: { chatIds: [], chats: {} } as ChatListInfo,
    history: { conversationIds: [], history: {} } as HistoryListInfo,
    inputMessages: { conversationIds: [], messages: {} } as InputMessageListInfo,
    actionBadge: '',
    isAuthorized: false,
    session: null,
    dialogsFilter: {} as DialogListFilterInfo
};

export function appStateFactory() {
    return INITIAL_APP_STATE;
}

export function rootReducer (state: AppBackgroundState, action: Action) {
  if (action.type === 'SET_NEW_STATE') {
      state = Object.assign({}, state, action.payload);
  }
  if (!environment.production) {
    return compose(storeLogger(), combineReducers)(appBackgroundState)(state, action);
  } else {
    return compose(combineReducers)(appBackgroundState)(state, action);
  }
}

export { DialogListActions, UsersActions, ChatsActions, HistoryActions, InputMessageActions } from './reducers';
