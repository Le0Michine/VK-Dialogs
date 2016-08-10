import { Injectable } from '@angular/core';
import { Message } from './message'
import { messagesFromNick } from './mock-messages'
import { VKService } from './vk-service'

@Injectable()
export class MessagesService {

    constructor(private vkservice: VKService) { }

    getMessages(id: number, type: string) {
        return Promise.resolve(messagesFromNick);
    }
}