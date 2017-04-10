import { Pipe, PipeTransform } from '@angular/core';

import { UserInfo } from '../datamodels';

@Pipe({ name: 'userFirstName' })
export class UserFirstNamePipe implements PipeTransform {
    transform(user: UserInfo) {
        return user && user.firstName ? user.firstName : 'loading...';
    }
}
