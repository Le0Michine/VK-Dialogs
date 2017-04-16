import { Pipe, PipeTransform } from '@angular/core';

import { SingleMessageInfo, UserSex } from '../datamodels';

@Pipe({
    name: 'chatAction',
    pure: false
})
export class ChatActionPipe implements PipeTransform {
    transform(message: SingleMessageInfo, userSex: UserSex): string {
        const sex = userSex === UserSex.female
            ? 'female'
            : userSex === UserSex.male
                ? 'male'
                : 'undef';

        switch (message.action) {
            case 'chat_kick_user':
                return message.actionMid !== message.userId ? `actions.${sex}.chat_kick_user2` : `actions.${sex}.chat_kick_user`;
            case 'chat_photo_remove':
                return `actions.${sex}.chat_photo_remove`;
            case 'chat_photo_update':
                return `actions.${sex}.chat_photo_update`;
            case 'chat_create':
                return `actions.${sex}.chat_create`;
            case 'chat_invite_user':
                return message.actionMid !== message.userId ? `actions.${sex}.chat_invite_user2` : `actions.${sex}.chat_invite_user`;
            default:
                return message.action;
        }
    }
}
