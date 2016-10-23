import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/of";
import "rxjs/add/operator/map";
import "rxjs/add/operator/concatMap";

import { UserInfo } from "./datamodels/datamodels";

import { VKService } from "./vk-service";
import { CacheService } from "./cache-service";
import { LPSService } from "./lps-service";
import { ChromeAPIService } from "./chrome-api-service";
import { Channels } from "./channels";

@Injectable()
export class UserService {
    private onUsersUpdate = new Subject();
    private initialized: boolean = false;

    constructor(
        private vkservice: VKService,
        private cache: CacheService,
        private lpsService: LPSService,
        private chromeapi: ChromeAPIService) { }

    init(): void {
        if (this.initialized) {
            console.warn("user service already initialized");
            return;
        }
        this.lpsService.userUpdate.subscribe(uids => this.updateUsers(uids));
        this.lpsService.resetHistory.subscribe(() => {
            console.log("update all users");
            let uids = Object.keys(this.cache.users_cache);
            this.updateUsers(uids.join());
        });
        this.chromeapi.registerObservable(this.onUsersUpdate);
        this.chromeapi.OnPortMessage("get_users").subscribe(() => {
            this.postUsersUpdate();
        });
        this.initialized = true;
    }

    updateUsers(uids: string): void {
        console.log("update users: ", uids);
        this.getUsers(uids, false).subscribe(users => {
            this.cache.pushUsers(users);
        },
        error => this.errorHandler(error, "updateUsers"));
    }

    postUsersUpdate(): void {
        console.log("post users update: ", this.cache.users_cache);
        if (Object.keys(this.cache.users_cache).length === 0) {
            console.log("there is no users, nothing to post");
            return;
        }
        this.onUsersUpdate.next({
            name: "users_update",
            data: this.cache.users_cache
        });
    }

    loadUsers(uids: string): void {
        console.log("load users: ", uids)
        if (!uids || uids.length === 0) return;
        this.getUsers(uids).subscribe(users => {
            this.cache.pushUsers(users);
            this.postUsersUpdate();
        },
        error => this.errorHandler(error, `loadUsers ${uids}`),
        () => console.log("loaded users: " + uids));
    }

    getUsers(uids: string, cache: boolean = true): Observable<{ [id: number] : UserInfo }> {
        let already_cached = true;
        let users = {};
        for (let uid of uids.split(",").map(id => Number(id))) {
            if (uid in this.cache.users_cache) {
                users[uid] = this.cache.users_cache[uid];
            }
            else {
                already_cached = false;
                break;
            }
        }
        if (already_cached && cache) {
            return Observable.of(users);
        }

        return this.vkservice
            .performAPIRequest("users.get", `user_ids=${uids}&fields=photo_50,online`)
            .map(json => this.toUsersDictionary(json));
    }

    toUsersDictionary(json): {[id: number] : UserInfo } {
        let users: {[id: number] : UserInfo } = {};
        for (let user_json of json) {
            users[user_json.id] = this.toUserViewModel(user_json);
            this.cache.users_cache[user_json.id] = this.toUserViewModel(user_json);
        }
        return users;
    }

    toUserViewModel(json): UserInfo {
        var user = new UserInfo();
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