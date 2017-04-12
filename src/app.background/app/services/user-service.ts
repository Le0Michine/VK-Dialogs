import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { UserInfo } from '../datamodels';

import { VKService } from './vk-service';
import { LPSService } from './lps-service';

import { UsersActions, AppBackgroundState } from '../app-background.store';
import { UserMapper } from '../api-model-mappers';

@Injectable()
export class UserService {
    private initialized = false;

    constructor(
        private store: Store<AppBackgroundState>,
        private vkservice: VKService,
        private lpsService: LPSService
    ) { }

    init(): void {
        if (this.initialized) {
            console.warn('user service already initialized');
            return;
        }
        this.lpsService.userUpdate.subscribe(uids => this.loadUsers(uids));
        this.lpsService.resetHistory.subscribe(() => {
            console.log('update all users');
            this.store.select(s => s.users.userIds).first().subscribe(uids => this.loadUsers(uids.join()));
        });
        this.initialized = true;
    }

    loadUsers(uids: string): void {
        console.log('load users: ', uids);
        if (!uids || uids.length === 0) {
            return;
        }
        this.getUsers(uids).subscribe(
            users => this.store.dispatch({ type: UsersActions.USERS_UPDATED, payload: users }),
            error => this.errorHandler(error, `loadUsers ${uids}`),
            () => console.log('loaded users: ' + uids)
        );
    }

    getUsers(uids: string, cache: boolean = true): Observable<{ [id: number]: UserInfo }> {
        return this.vkservice
            .performAPIRequestsBatch('users.get', {user_ids: uids, fields: 'photo_50,online,sex'})
            .map(json => UserMapper.toUsersList(json));
    }

    errorHandler(error, comment: string): void {
        console.error(`An error occurred ${comment}:`, error);
    }
}
