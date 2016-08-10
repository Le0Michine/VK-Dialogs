import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Dialog } from './dialog'
import { Chat } from './dialog'
import { User } from './user'
import { DialogComponent } from './dialog.component'
import { MessagesService } from './messages-service'
import { UserService } from './user-service'
import { VKService } from './vk-service'

import { messagesFromNick, messagesFromSofy } from './mock-messages'

@Component({
  selector: 'dialogs',
  templateUrl: 'app/dialogs.component.html',
  styleUrls: ['app/dialogs.component.css'],
  directives: [DialogComponent]
})
export class DialogsComponent implements OnInit { 
    title = "Dialogs";
    user: User = new User();

    dialogs: Dialog[] = [
        {unread: 1, messages: messagesFromNick},
        {unread: 2, messages: messagesFromSofy}
    ]

    constructor(private userService: UserService, private router: Router, private vkservice: VKService) {
        this.vkservice.auth();
    }

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

    ngOnInit() {
        this.userService.getUser(1).subscribe(
            u => this.user = u, 
            error => this.errorHandler(error), 
            () => console.log('user data obtained'));
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}
