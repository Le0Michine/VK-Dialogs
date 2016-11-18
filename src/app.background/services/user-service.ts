import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";
import "rxjs/add/operator/map";
import "rxjs/add/operator/concatMap";

import { UserInfo } from "../datamodels";

import { VKService } from "./vk-service";
import { LPSService } from "./lps-service";

import { UsersActions, AppBackgroundState } from "../app-background.store";

@Injectable()
export class UserService {
    private initialized: boolean = false;

    constructor(
        private store: Store<AppBackgroundState>,
        private vkservice: VKService,
        private lpsService: LPSService
    ) { }

    init(): void {
        if (this.initialized) {
            console.warn("user service already initialized");
            return;
        }
        this.lpsService.userUpdate.subscribe(uids => this.loadUsers(uids));
        this.lpsService.resetHistory.subscribe(() => {
            console.log("update all users");
            this.store.select(s => s.users.userIds).first().subscribe(uids => this.loadUsers(uids.join()));
        });
        this.initialized = true;
    }

    loadUsers(uids: string): void {
        console.log("load users: ", uids);
        if (!uids || uids.length === 0){
            return;
        }
        this.getUsers(uids).subscribe(
            users => this.store.dispatch({ type: UsersActions.USERS_UPDATED, payload: users }),
            error => this.errorHandler(error, `loadUsers ${uids}`),
            () => console.log("loaded users: " + uids)
        );
    }

    getUsers(uids: string, cache: boolean = true): Observable<{ [id: number]: UserInfo }> {
        return this.vkservice
            .performAPIRequest("users.get", {user_ids: uids, fields: "photo_50,online"})
            .map(json => this.toUsersList(json));
    }

    toUsersList(json): UserInfo[] {
        return json.map(userJson => this.toUserViewModel(userJson));
    }

    toUserViewModel(json): UserInfo {
        let user = new UserInfo();
        user.firstName = json.first_name;
        user.lastName = json.last_name;
        user.id = json.id;
        user.photo50 = json.photo_50;
        user.isOnline = json.online;
        return user;
    }

    errorHandler(error, comment: string): void {
        console.error(`An error occurred ${comment}:`, error);
    }
}