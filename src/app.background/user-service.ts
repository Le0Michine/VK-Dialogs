import { Injectable } from "@angular/core";
import { Observable }     from "rxjs/Observable";
import "rxjs/add/operator/map";
import "rxjs/add/observable/of";

import { VKConsts } from "../app/vk-consts";
import { SessionInfo } from "../app/session-info";
import { User } from "../app/user";

import { ErrorHelper } from "./error-helper";
import { VKService } from "./vk-service";
import { CacheService } from "./cache-service";
import { LPSService } from "./lps-service";
import { Channels } from "./channels";

@Injectable()
export class UserService {
    private update_users_port: chrome.runtime.Port;

    constructor(private vkservice: VKService,  private cache: CacheService, private lpsService: LPSService) {
        lpsService.subscribeOnUserUpdate(uids => this.updateUsers(uids));
        chrome.runtime.onConnect.addListener(port => {
            switch (port.name) {
                case "users_monitor":
                    this.update_users_port = port;
                    this.postUsersUpdate();
                    this.update_users_port.onDisconnect.addListener(() => {
                        this.update_users_port = null;
                    });
                    this.update_users_port.onMessage.addListener((message: any) => {
                        if (message.name === Channels.get_users_request) {
                            this.postUsersUpdate();
                        }
                    });
                    break;
            }
        });
    }

    updateUsers(uids: string) {
        this.getUsers(uids, false).subscribe(users => {
            this.cache.pushUsers(users);
        },
        error => this.errorHandler(error, "updateUsers"));
    }

    postUsersUpdate() {
        if (this.update_users_port) {
            console.log("post users_update message");
            this.update_users_port.postMessage({name: "users_update", data: this.cache.users_cache});
        }
        else {
            console.log("port users_update is closed");
        }
    }

    loadUsers(uids: string): void {
        if (!uids || uids.length === 0) return;
        this.getUsers(uids).subscribe(users => {
            this.cache.pushUsers(users);
            this.postUsersUpdate();
        },
        error => this.errorHandler(error, `loadUsers ${uids}`),
        () => console.log("loaded users: " + uids));
    }

    getUsers(uids: string, cache: boolean = true): Observable<{}> {
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
            .map(json => this.toUser(json));
    }

    getUser(uid: number = null): Observable<User> {
        let obs;
        if (uid) {
            obs = this.getUser(uid).map(dict => dict[Object.keys(dict)[0]]);
        }
        else {
            obs = this.vkservice.getSession().concatMap(session => {
                if (!session) {
                    return Observable.of({});
                }
                return this.vkservice.performAPIRequest("users.get", `user_ids=${session.user_id}&fields=photo_50,online`);
            }).map(json => json[0]);
        }
        return obs;
    }

    private toUser(json): {} {
        if (ErrorHelper.checkErrors(json)) return {};
        let users = {};
        for (let user_json of json) {
            users[user_json.id] = user_json as User;
            this.cache.users_cache[user_json.id] = user_json as User;
        }
        return users;
    }

    errorHandler(error, comment: string) {
        console.error(`An error occurred ${comment}:`, error);
        // return Promise.reject(error.message || error);
    }
}