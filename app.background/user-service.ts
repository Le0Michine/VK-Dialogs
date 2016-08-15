import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Observable }     from 'rxjs/Observable';

import { VKConsts } from '../app/vk-consts';
import { SessionInfo } from '../app/session-info';
import { User } from '../app/user';

import { VKService } from './vk-service';

@Injectable()
export class UserService {
    constructor(private vkservice: VKService, private http: Http) { }

    getUsers(uids: string): Observable<{}> {
        let session = this.vkservice.getSession();
        let uri = VKConsts.api_url 
            + 'users.get?user_ids=' + uids 
            + '&fields=photo_50,online'
            + '&access_token=' + session.access_token
            + '&v=' + VKConsts.api_version;
        return this.http.get(uri)
                .map(res => res.json())
                .map(json => this.createUser(json));
    }

    getUser(uid: number = null): Observable<User> {
        let session = this.vkservice.getSession();
        let uri = VKConsts.api_url 
            + 'users.get?user_ids=' + (uid != null ? uid : session.user_id) 
            + '&fields=photo_50,online'
            + '&access_token=' + session.access_token
            + '&v=' + VKConsts.api_version;
        return this.http.get(uri)
                .map(res => res.json())
                .map(json => this.createUser(json))
                .map(dict => dict[Object.keys(dict)[0]] as User);
    }

    createUser(result: string): {} {
        let users = {};
        let users_json = result['response'];
        for (let user_json of users_json) {
            users[user_json.id] = user_json as User;
        }
        return users;
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}