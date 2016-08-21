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
import { DialogPhotoComponent } from '../dialog-photo.component';

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
        if (this.users && this.users[uid] && this.users[uid].photo_50) {
            return this.users[uid].photo_50;
        }
       
}