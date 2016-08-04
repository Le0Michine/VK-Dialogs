import { Injectable } from '@angular/core';
import { Message } from './message'
import { messagesFromNick } from './mock-messages'

@Injectable()
export class MessagesService {
   getMessages(id: number, type: string) {
       return Promise.resolve(messagesFromNick);
   }
}