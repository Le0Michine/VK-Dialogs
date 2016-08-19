import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Message, Chat } from './message'
import { Dialog } from './Dialog'
import { User } from './user'
import { DialogComponent } from './dialog.component'
import { UserService } from './user-service'
import { VKService } from './vk-service'
import { DialogService } from './dialogs-service'
import { DateConverter } from './date-converter'
import { Observable as Observable1 } from 'rxjs/Rx';
import { VKConsts } from './vk-consts';

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

    dialogs: Dialog[];

    constructor(
        private userService: UserService,
        private router: Router,
        private vkservice: VKService,
        private dialog_service: DialogService,
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
        if (window.localStorage.getItem(VKConsts.user_denied) == 'true' || this.vkservice.getSession() == null) {
            this.router.navigate(['/authorize']);
            return;
        }

        this.userService.getUser().subscribe(
            u => {
                this.user = u;
                this.change_detector.detectChanges();
            }, 
            error => this.errorHandler(error), 
            () => console.log('user data obtained'));

        this.dialog_service.subscribeOnDialogsUpdate(dialogs => {
            this.dialogs = dialogs;
            this.change_detector.detectChanges();
        });

        this.userService.subscribeOnUserUpdate(users => {
            this.users = users;
            this.change_detector.detectChanges();
        });
    }

    ngOnDestroy() {
        console.log('dialogs component destroy');
        this.dialog_service.unsubscribeFromDialogs();
    }

    formatDate(unixtime: number) {
        return DateConverter.formatDate(unixtime);
    }

    getUserName(uid: number) {
        if (this.users && this.users[uid]) {
            return this.users[uid].first_name + ' ' + this.users[uid].last_name;
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
