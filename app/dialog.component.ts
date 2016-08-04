import { Component } from '@angular/core';
import { Dialog } from './dialog'
import { Message } from './message'

import { messagesFromNick, messagesFromSofy } from './mock-messages'

@Component({
  selector: 'messges',
  templateUrl: 'app/dialog.component.html'
})
export class DialogComponent { 
    title = "Dialog";
    messages: Message[] = messagesFromSofy;
}