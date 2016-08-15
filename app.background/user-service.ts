import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Observable }     from 'rxjs/Observable';

import { VKConsts } from '../app/vk-consts';
import { SessionInfo } from '../app/session-info';
import { User } from '../app/user';

import { VKService } from './vk-service';
import { ObservableExtension } from './observable-extension';

@Injectable()
export class UserService {
    private cached_users: {} = {};
    private cached_user_ids: number[] = [];

    constructor(private vkservice: VKService, private http: Http) { }

    getUsers(uids: string): Observable<{}> {
        let already_cached = true;
        let users = {};
        for (let uid of uids.split(',').map(id => Number(id))) {
            if (uid in this.cached_user_ids) {
                users[uid] = this.cached_users[uid];
            }
            else {
                already_cached = false;
                break;
            }
        }
        if (already_cached) {
            return ObservableExtension.resolveOnValue(users);
        }

        let session = this.vkservice.getSession();
        let uri = VKConsts.api_url 
            + 'users.get?user_ids=' + uids 
            + '&fields=photo_50,online'
            + '&access_token=' + session.access_token
            + '&v=' + VKConsts.api_version;
        return this.http.get(uri)
                .map(res => res.json())
                .map(json => this.toUser(json));
    }

    getUser(uid: number = null): Observable<User> {
        if (uid in this.cached_user_ids) {
            ObservableExtension.resolveOnValue(this.cached_users[uid]);
        }
        let session = this.vkservice.getSession();
        let uri = VKConsts.api_url 
            + 'users.get?user_ids=' + (uid != null ? uid : session.user_id) 
            + '&fields=photo_50,online'
            + '&access_token=' + session.access_token
            + '&v=' + VKConsts.api_version;
        return this.http.get(uri)
                .map(res => res.json())
                .map(json => this.toUser(json))
                .map(dict => dict[Object.keys(dict)[0]] as User);
    }

    private toUser(result: string): {} {
        let users = {};
        let users_json = result['response'];
        for (let user_json of users_json) {
            users[user_json.id] = user_json as User;
            this.cached_user_ids.push(user_json.id);
            this.cached_users[user_json.id] = user_json as User;;
        }
        return users;
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}