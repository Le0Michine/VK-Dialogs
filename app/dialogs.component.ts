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
        if ((dialog as Chat).chat_id) {
            let chat = dialog as Chat;
            link = ["/dialog", chat.chat_id.toString(), "chat", chat.chat_active.join()];
        }
        else {
            link = ["/dialog", dialog.user_id.toString(), "dialog", [this.user.id, dialog.user_id].join()];
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
            uids.push(dialog.user_id);
        }
        this.userService.getUsers(uids.join()).subscribe(
            users => this.users = users,
            error => this.errorHandler(error),
            () => console.log('users loaded')
        );
    }

    convertDate(unixtime: number) {
        return DateConverter.convertDateTime(unixtime);
    }

    getUserName(uid: number) {
        if (this.users && this.users[uid]) {
            return this.users[uid].first_name;
        }
        return 'undefined'; 
    }

    getUserPhoto(uid: number) {
        if (this.users && this.users[uid].photo_50) {
            return this.users[uid].photo_50;
        }
        return 'http://vk.com/images/camera_c.gif';
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}
