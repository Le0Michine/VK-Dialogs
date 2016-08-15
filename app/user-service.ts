import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Observable }     from 'rxjs/Observable';

import { Channels } from '../app.background/channels';

import { User } from './user';
import { VKService } from './vk-service';
import { VKConsts } from './vk-consts';
import { SessionInfo } from './session-info';
import { RequestHelper } from './request-helper';

@Injectable()
export class UserService {
    constructor(private vkservice: VKService, private http: Http) { }

    getUsers(uids: string): Observable<{}> {
        console.log('users requested');
        return RequestHelper.sendRequestToBackground({
            name: Channels.get_multiple_users_request,
            user_ids: uids
        });
    }

    getUser(uid: number = null): Observable<User> {        
        console.log('one user requested');
        return RequestHelper.sendRequestToBackground({
            name: Channels.get_user_request,
            user_id: uid
        });
    }
}