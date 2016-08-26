import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Observable }     from 'rxjs/Observable';

import { VKConsts } from '../app/vk-consts';
import { SessionInfo } from '../app/session-info';
import { User } from '../app/user';

import { ErrorHelper } from './error-helper';
import { VKService } from './vk-service';
import { ObservableExtension } from './observable-extension';
import { CacheService } from './cache-service';
import { LPSService } from './lps-service';
import { Channels } from './channels';

@Injectable()
export class UserService {
    private update_users_port: chrome.runtime.Port;

    constructor(private vkservice: VKService, private http: Http,  private cache: CacheService, private lpsService: LPSService) {
        lpsService.subscribeOnUserUpdate(uids => this.updateUsers(uids));
        chrome.runtime.onConnect.addListener(port => {
            switch (port.name) {
                case 'users_monitor':
                    this.update_users_port = port;
                    this.postUsersUpdate();
                    this.update_users_port.onDisconnect.addListener(() => {
                        this.update_users_port = null;
                    });
                    this.update_users_port.onMessage.addListener((message: any) => {
                        if(message.name === Channels.get_users_request) {
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
        });
    }

    postUsersUpdate() {
        if (this.update_users_port) {
            console.log('post users_update message');
            this.update_users_port.postMessage({name: 'users_update', data: this.cache.users_cache});
        }
        else {
            console.log('port users_update is closed');
        }
    }

    loadUsers(uids: string): void {
        this.getUsers(uids).subscribe(users => {
            this.cache.pushUsers(users);
            this.postUsersUpdate();
        },
        error => this.errorHandler(error),
        () => console.log('loaded users: ' + uids));
    }

    getUsers(uids: string, cache: boolean = true): Observable<{}> {
        let already_cached = true;
        let users = {};
        for (let uid of uids.split(',').map(id => Number(id))) {
            if (uid in this.cache.users_cache) {
                users[uid] = this.cache.users_cache[uid];
            }
            else {
                already_cached = false;
                break;
            }
        }
        if (already_cached && cache) {
            return ObservableExtension.resolveOnValue(users);
        }

        return this.vkservice.getSession().concatMap(session => {
            let uri = VKConsts.api_url 
                + 'users.get?user_ids=' + uids 
                + '&fields=photo_50,online'
                + '&access_token=' + session.access_token
                + '&v=' + VKConsts.api_version;
            return this.http.get(uri)
                .map(res => res.json())
                .map(json => this.toUser(json));
        });
    }

    getUser(uid: number = null): Observable<User> {
        return this.vkservice.getSession().concatMap(session => {
            if (uid ? uid in this.cache.users_cache : session.user_id in this.cache.users_cache) {
                return ObservableExtension.resolveOnValue(this.cache.users_cache[uid ? uid : session.user_id]);
            }
            let uri = VKConsts.api_url 
                + 'users.get?user_ids=' + (uid != null ? uid : session.user_id) 
                + '&fields=photo_50,online'
                + '&access_token=' + session.access_token
                + '&v=' + VKConsts.api_version;
            return this.http.get(uri)
                .map(res => res.json())
                .map(json => this.toUser(json))
                .map(dict => dict[Object.keys(dict)[0]] as User);
        });
    }

    private toUser(json): {} {
        if (ErrorHelper.checkErrors(json)) return {};
        let users = {};
        let users_json = json.response;
        for (let user_json of users_json) {
            users[user_json.id] = user_json as User;
            this.cache.users_cache[user_json.id] = user_json as User;;
        }
        return users;
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        //return Promise.reject(error.message || error);
    }
}