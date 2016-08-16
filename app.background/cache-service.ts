import { Injectable } from '@angular/core';

import { VKConsts } from '../app/vk-consts';
import { Message, Chat } from '../app/message';
import { Dialog } from '../app/dialog';
import { User } from '../app/user';

@Injectable()
export class CacheService {
    dialogs_cache: Dialog[];
    messages_cache: Message[];
    users_cache: {};
}