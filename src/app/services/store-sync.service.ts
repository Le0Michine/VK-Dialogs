import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Store } from "@ngrx/Store";

import { VKService } from "./vk.service";
import { ChromeAPIService } from "./chrome-api.service";
import { UserInfo, UserListInfo, ChatListInfo, HistoryListInfo, DialogListInfo } from "../datamodels";

import { AppStore, HistoryActions, ChatListActions, DialogListActions, UserListActions } from "../app.store";

@Injectable()
export class StoreSyncService {
    private initialized: boolean = false;

    constructor(
        private chromeapi: ChromeAPIService,
        private store: Store<AppStore>
    ) { }

    init() {
        if (this.initialized) return;
        this.chromeapi.subscribeOnMessage("chats_update").map(x => x.data)
            .subscribe((x: ChatListInfo) =>
                this.store.dispatch({ type: ChatListActions.UPDATE, payload: x })
            );
        this.chromeapi.subscribeOnMessage("history_update").map(x => x.data)
            .subscribe((x: HistoryListInfo) =>
                this.store.dispatch({ type: HistoryActions.UPDATE, payload: x })
            );
        this.chromeapi.subscribeOnMessage("users_update").map(x => x.data)
            .subscribe((x: UserListInfo) =>
                this.store.dispatch({ type: UserListActions.UPDATE, payload: x })
            );
        this.chromeapi.subscribeOnMessage("dialogs_update").map(x => x.data)
            .subscribe((x: DialogListInfo) =>
                this.store.dispatch({ type: DialogListActions.UPDATE, payload: x })
            );

        this.initialized = true;
    }
}