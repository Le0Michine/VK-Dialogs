import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Message } from './message'
import { Chat } from './message'
import { User } from './user'
import { DialogComponent } from './dialog.component'
import { UserService } from './user-service'
import { VKService } from './vk-service'
import { DialogService } from './dialogs-service'
import { DateConverter } from './date-converter'
import { Observable as Observable1 } from 'rxjs/Rx';

@Component({
  selector: 'dialogs',
  templateUrl: 'app/dialogs.component.html',
  styleUrls: ['app/dialogs.component.css'],
  directives: [DialogComponent],
  //changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogsComponent implements OnInit { 
    title = "Dialogs";
    user: User = new User();
    users: {};

    i: number = 0;

    dialogs: Message[];

    constructor(
        private userService: UserService,
        private router: Router, 
        private vkservice: VKService, 
        private dialogsService: DialogService,
        private change_detector: ChangeDetectorRef) { }

    gotoDialog(dialog: Message) {
        let link: string[];
        if ((dialog as Chat).chat_id) {
            let chat = dialog as Chat;
            link = ["/dialog", chat.chat_id.toString(), "chat", chat.title, chat.chat_active.join()];
        }
        else {
            let user: User = this.users[dialog.user_id];
            let title: string = dialog.title === ' ... ' ? user.first_name + ' ' + user.last_name : dialog.title;
            link = [
                "/dialog",
                dialog.user_id.toString(),
                "dialog",
                title,
                [this.user.id, dialog.user_id].join()];
        }
        this.router.navigate(link);
    }

    ngOnInit() {
        this.userService.getUser().subscribe(
            u => {
                this.user = u;
            }, 
            error => this.errorHandler(error), 
            () => console.log('user data obtained'));

        this.dialogsService.getDialogs().subscribe(
            dialogs => { 
                this.dialogs = dialogs as Message[];
                this.initUsers();
                this.change_detector.detectChanges();
            },
            error => this.errorHandler(error),
            () => console.log('dialogs loaded'));
    }

    ngOnDestroy() {
        console.log('dialogs component destroy');
    }

    initUsers() {
        let uids: number[] = [];
        for (let dialog of this.dialogs) {
            uids.push(dialog.user_id);
        }
        this.userService.getUsers(uids.join()).subscribe(
            users => { 
                this.users = users; 
                this.change_detector.detectChanges();
            },
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
        return 'loading...'; 
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
