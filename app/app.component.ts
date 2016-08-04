import { Component } from '@angular/core';
import { Dialog } from './dialog'

import { messagesFromNick, messagesFromSofy } from './mock-messages'

@Component({
  selector: 'my-app',
  templateUrl: 'app/app.component.html'
})
export class AppComponent { 
    title = "Dialogs";

    dialogs: Dialog[] = [
        {unread: 1, messages: messagesFromNick},
        {unread: 2, messages: messagesFromSofy}
    ]
}
