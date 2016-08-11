import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/toPromise';

import { User } from './user';
import { VKService } from './vk-service';
import { VKConsts } from './vk-consts';
import { SessionInfo } from './session-info';

@Injectable()
export class UserService {
    constructor(private vkservice: VKService, private http: Http) { }

    getUser() {
        let session = this.vkservice.getSession();
        return this.http.get(VKConsts.api_url + 'users.get?user_ids=' + session.user_id)
                .map(res => res.json())
                .map(json => this.createUser(json));
    }

    createUser(result: string) {
        console.log('result: ' + result)
        let user_string = result['response'][0];
        let user = new User();
        user.user_id = user_string['uid'];
        user.user_name = user_string['first_name'];
        return user;
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}
//54570222