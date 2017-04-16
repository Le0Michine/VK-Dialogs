import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Store } from '@ngrx/store';

import { VKService } from './vk.service';
import { ChromeAPIService } from './chrome-api.service';
// tslint:disable-next-line:max-line-length
import { DialogListFilterInfo, UserInfo, UserListInfo, ChatListInfo, HistoryListInfo, DialogListInfo, InputMessageListInfo, InputMessageState } from '../datamodels';

import { AppState, HistoryActions, ChatListActions, DialogListActions, UserListActions } from '../app.store';
import { replaceMessage, replaceDialogListFilter } from '../actions';

@Injectable()
export class StoreSyncService {
    private initialized = false;

    constructor(
        private chromeapi: ChromeAPIService,
        private store: Store<AppState>
    ) { }

    init() {
        if (this.initialized) {
            return;
        }
        this.chromeapi.subscribeOnMessage('chats_update').map(x => x.data)
            .subscribe((x: ChatListInfo) =>
                this.store.dispatch({ type: ChatListActions.UPDATE, payload: x })
            );
        this.chromeapi.subscribeOnMessage('history_update').map(x => x.data)
            .subscribe((x: HistoryListInfo) =>
                this.store.dispatch({ type: HistoryActions.UPDATE, payload: x })
            );
        this.chromeapi.subscribeOnMessage('users_update').map(x => x.data)
            .subscribe((x: UserListInfo) =>
                this.store.dispatch({ type: UserListActions.UPDATE, payload: x })
            );
        this.chromeapi.subscribeOnMessage('dialogs_update').map(x => x.data)
            .subscribe((x: DialogListInfo) =>
                this.store.dispatch({ type: DialogListActions.UPDATE, payload: x })
            );
        this.chromeapi.subscribeOnMessage('input_message').map(x => x.data)
            .subscribe((x: InputMessageListInfo) =>
                this.store.dispatch(replaceMessage(x))
            );
        this.chromeapi.subscribeOnMessage('dialog_list_filter').map(x => x.data)
            .subscribe((x: DialogListFilterInfo) =>
                this.store.dispatch(replaceDialogListFilter(x))
            );

        this.initialized = true;
    }

    subscribeOnHistory(peerId: number, isChat: boolean): Subscription {
        return this.chromeapi.subscribeOnMessage(`history_update_${peerId}_${isChat}`)
            .subscribe(() => {});
    }
}
