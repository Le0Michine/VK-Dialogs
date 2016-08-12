import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Message } from './message'
import { Chat } from './message'
import { User } from './user'
import { DialogComponent } from './dialog.component'
import { MessagesService } from './messages-service'
import { UserService } from './user-service'
import { VKService } from './vk-service'
import { DialogService } from './dialogs-service'
import { DateConverter } from './date-converter'

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
    users: {};

    dialogs: Message[];

    constructor(private userService: UserService,
        private router: Router, 
        private vkservice: VKService, 
        private dialogsService: DialogService) { }

    gotoDialog(dialog: Message) {
        let link: string[];
        if (dialog instanceof Chat) {
            link = ["/dialog", (dialog as Chat).chat_id.toString(), "chat"];
        }
        else {
            link = ["/dialog", dialog.user_id.toString(), "dialog"];
        }
        this.router.navigate(link);
    }

    ngOnInit() {
        this.userService.getUser().subscribe(
            u => this.user = u, 
            error => this.errorHandler(error), 
            () => console.log('user data obtained'));

        this.dialogsService.getDialogs().subscribe(
            dialogs => { this.dialogs = dialogs as Message[]; this.initUsers(); },
            error => this.errorHandler(error),
            () => console.log('dialogs loaded'));
    }

    initUsers() {
        let uids: number[] = [];
        for (let dialog of this.dialogs) {
            uids.push(dialog['message']['user_id']);
        }
        this.userService.getUsers(uids).subscribe(
            users => this.users = users,
            error => this.errorHandler(error),
            () => console.log('users loaded')
        );
    }

    convertDate(unixtime: number) {
        return DateConverter.convertDateTime(unixtime);
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}
