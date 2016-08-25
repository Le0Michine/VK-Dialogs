import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs/Rx';
import { Message, Chat, CHAT_ACTIONS } from './message'
import { Dialog, DialogToShow } from './Dialog'
import { User } from './user'
import { DialogComponent } from './dialog.component'
import { UserService } from './user-service'
import { VKService } from './vk-service'
import { DialogService } from './dialogs-service'
import { DateConverter } from './date-converter'
import { VKConsts } from './vk-consts';
import { ATTACHMENT_TYPES } from './attachment-data-types';

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
    chats: {};
    dialogs_count: number;

    i: number = 0;

    dialogs: Dialog[] = [];

    subscriptions: Subscription[] = [];

    constructor(
        private user_service: UserService,
        private router: Router,
        private vkservice: VKService,
        private dialog_service: DialogService,
        private change_detector: ChangeDetectorRef) { }

    gotoDialog(dialog: Message) {
        let link: string[];
        if ((dialog as Chat).chat_id) {
            let chat = dialog as Chat;
            let active: string = chat.chat_active.length > 0 ? chat.chat_active.join() : this.user.id.toString();
            link = ["/dialog", chat.chat_id.toString(), "chat", chat.title, active];
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

    loadOldDialogs() {
        this.dialog_service.loadOldDialogs();
    }

    ngOnInit() {
        if (window.localStorage.getItem(VKConsts.user_denied) == 'true' || this.vkservice.getSession() == null) {
            this.router.navigate(['/authorize']);
            return;
        }

        this.user_service.getUser().subscribe(
            u => {
                this.user = u;
                this.change_detector.detectChanges();
            }, 
            error => this.errorHandler(error), 
            () => console.log('user data obtained'));

        this.subscriptions.push(this.dialog_service.dialogs_observable.subscribe(dialogs => {
                this.dialogs = dialogs as Dialog[];
                this.change_detector.detectChanges();
            },
            error => this.errorHandler(error),
            () => console.log('finished dialogs update')
        ));
        this.dialog_service.requestDialogs();

        this.subscriptions.push(this.user_service.users_observable.subscribe(users => {
                    this.users = users;
                    this.change_detector.detectChanges();
                },
                error => this.errorHandler(error),
                () => console.log('finished users update')
            )
        );
        this.user_service.requestUsers();

        this.subscriptions.push(this.dialog_service.chat_observable.subscribe(chats => {
                this.chats = chats;
                this.change_detector.detectChanges();
            },
            error => this.errorHandler(error),
            () => console.log('finished chats update'))
        );
        this.dialog_service.requestChats();

        this.dialog_service.subscribeOnDialogsCountUpdate(count => this.dialogs_count = count);
    }

    ngOnDestroy() {
        console.log('dialogs component destroy');
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
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

    getUserFirstName(uid: number) {
        if (this.users && this.users[uid]) {
            return this.users[uid].first_name;
        }
        return 'loading...'; 
    }

    getUserPhoto(uid: number) {
        if (this.users && this.users[uid] && this.users[uid].photo_50) {
            return this.users[uid].photo_50;
        }
        return 'http://vk.com/images/camera_c.gif';
    }

    getDialogs() {
        if (!this.users) return [];
        let dialogs: DialogToShow[] = [];
        for (let dialog of this.dialogs) {
            //console.log(JSON.stringify(dialog));
            let uid = dialog.message.user_id;
            let dts = new DialogToShow();
            dts.message = dialog.message;
            dts.unread = dialog.unread;
            dts.title = dialog.message.title === ' ... ' ? this.getUserName(uid) : dialog.message.title;
            dts.date_format = DateConverter.formatDate(Number(dialog.message.date));
            dts.sender = dialog.message.out ? this.user.first_name : this.getUserFirstName(uid);
            dts.online = this.users[uid].online;
            
            if (dialog.message.fwd_messages) {
                dts.attachment_type = 'Forwarded message';
            }
            else if (dialog.message.attachments && dialog.message.attachments[0]) {
                dts.attachment_type = ATTACHMENT_TYPES[dialog.message.attachments[0].type];
            }
            dts.attachment_only = dts.attachment_type != '' && dts.message.body === '';

            let chat = dialog.message as Chat;
            if (chat.chat_id) {
                dts.online = false;
                if (chat.photo_50) {
                    dts.photos = [chat.photo_50];
                }
                else if (this.chats && this.chats[chat.chat_id] && this.chats[chat.chat_id].users.length > 0) {
                    dts.photos = (this.chats[chat.chat_id].users as User[]).filter(user => user.id != this.user.id).map(user => user.photo_50).slice(0, 4);
                }
                else if (this.chats && this.chats[chat.chat_id] && this.chats[chat.chat_id].users.length == 0 && chat.action) {
                    chat.read_state = true;
                }
            }
            else if (this.users && this.users[uid] && this.users[uid].photo_50) {
                dts.photos = [this.users[uid].photo_50];
            }
            dialogs.push(dts);
        }
        return dialogs;
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        //return Promise.reject(error.message || error);
    }
}
