import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Dialog } from './dialog'
import { Chat } from './dialog'
import { DialogComponent } from './dialog.component'
import { MessagesService } from './messages-service'

import { messagesFromNick, messagesFromSofy } from './mock-messages'

@Component({
  selector: 'dialogs',
  templateUrl: 'app/dialogs.component.html',
  directives: [DialogComponent],
  providers: [MessagesService]
})
export class DialogsComponent { 
    title = "Dialogs";

    dialogs: Dialog[] = [
        {unread: 1, messages: messagesFromNick},
        {unread: 2, messages: messagesFromSofy}
    ]

    constructor(private router: Router) { }

    gotoDialog(dialog: Dialog) {
        let link: string[];
        if (dialog instanceof Chat) {
            link = ["/dialog", (dialog as Chat).chat_id.toString(), "chat"];
        }
        else {
            link = ["/dialog", dialog.messages[0].user_id.toString(), "dialog"];
        }
        this.router.navigate(link);
    }
}
