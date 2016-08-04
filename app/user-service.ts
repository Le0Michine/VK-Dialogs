import { Injectable } from '@angular/core';

import { User } from './user';

@Injectable()
export class UserService {
    getUser(id: number) {
        return Promise.resolve<User>({user_id: 1234, user_name: "User-name"});
    }
}