import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
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
  selector: 'dialog-photo',
  templateUrl: 'app/dialogs.component.html',
  styleUrls: ['app/dialogs.component.css']
})
export class DialogPhotoComponent {
    @Input() chat_id: number;
    @Input() users_getter: {};
    @Input() current_user: number;
}