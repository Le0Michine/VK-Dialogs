import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Rx';
import { Message, Chat } from '../message'
import { Dialog } from '../Dialog'
import { User } from '../user'
import { UserService } from '../user-service'
import { DialogService } from '../dialogs-service'
import { DateConverter } from '../date-converter'
import { VKConsts } from '../vk-consts';

@Component({
  selector: 'dialog-view',
  templateUrl: 'app/components/templates/dialog-view.component.html',
  styleUrls: ['app/components/templates/dialog-view.component.css'],
  directives: []
})
export class DialogViewComponent {
    @Input() dialog: Dialog;
    @Input() users: {};
    @Input() current_user: User;
    private chats;
    private photos = ['http://vk.com/images/camera_c.gif'];
    private mini_avatars = false;

    constructor(private dialogs_service: DialogService, private user_service: UserService, private ref: ChangeDetectorRef) { }

    ngOnInit() { 
        if ((this.dialog.message as Chat).chat_id) {
            this.chats = this.dialogs_service.subscribeOnChatsUpdate(chats => {
                this.chats = chats;
                this.photos = this.getDialogPhoto();
                this.ref.detectChanges();
            });
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

    getUserPhoto(uid: number): string {
        if (this.users && this.users[uid] && this.users[uid].photo_50) {
            return this.users[uid].photo_50;
        }
        return 'http://vk.com/images/camera_c.gif';
    }

    getDialogPhoto() {
        let chat_id = (this.dialog.message as Chat).chat_id;
        let default_photo = ['http://vk.com/images/camera_c.gif'];
        if ((this.dialog.message as Chat).photo_50) {
            return [(this.dialog.message as Chat).photo_50];
        }
        else if (chat_id) {
            if (this.chats) {
                let chat = this.chats[chat_id];
                if (chat) {
                    console.log(JSON.stringify(this.current_user));
                    console.log(JSON.stringify(chat.users));
                    let users = (chat.users as User[]).filter(user => user.id != this.current_user.id).map(user => user.photo_50).slice(0, 4);
                    this.mini_avatars = users && users.length > 0;
                    return users && users.length > 0 ? users : default_photo;
                }
            }
        }
        else {
            let user_img = this.getUserPhoto(this.dialog.message.user_id);
            if (user_img) {
                return [user_img];
            }
        }
        return default_photo;
    }
}