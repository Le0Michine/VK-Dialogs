import { Pipe, PipeTransform } from '@angular/core';

import { UserInfo } from '../datamodels';
import { VKUtils } from '../../../app.shared/vk-utils';

@Pipe({ name: 'userAvatar' })
export class UserAvatarPipe implements PipeTransform {
    transform(user: UserInfo) {
        return user && user.photo50 ? user.photo50 : VKUtils.getAvatarPlaceholder();
    }
}
