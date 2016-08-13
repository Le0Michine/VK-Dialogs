import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Message } from './message'
import { User } from './user'
import { DialogService } from './dialogs-service'
import { UserService } from './user-service'
import { VKService } from './vk-service'

import { messagesFromNick, messagesFromSofy } from './mock-messages'

@Component({
    selector: 'messges',
    templateUrl: 'app/dialog.component.html',
    styleUrls: ['app/dialog.component.css']
})
export class DialogComponent { 
    title = "Dialog";
    participants: {} = {};
    user_id: string;
    history: Message[];
    sub: any;

    constructor (
        private messagesService: DialogService,
        private vkservice: VKService, 
        private userService: UserService, 
        private route: ActivatedRoute) { }

    ngOnInit() {
        this.user_id = this.vkservice.getSession().user_id;
        this.sub = this.route.params.subscribe(params => {
            let id = +params['id'];
            let type = params['type'];
            let participants = params['participants'];
            let isChat: boolean = type === 'dialog' ? false : true;

            this.messagesService.getHistory(id, isChat).subscribe(
                m => this.history = m,
                error => this.errorHandler(error),
                () => console.log('history loaded'));

            this.userService.getUsers(participants).subscribe(
                users => this.participants = users,
                error => this.errorHandler(error),
                () => console.log('users obtained'));
      });
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    goBack() {
        window.history.back();
    }

    getUserName(uid: number) {
        if (this.participants && this.participants[uid]) {
            return this.participants[uid].first_name;
        }
        return 'undefined'; 
    }

    getUserPhoto(uid: number) {
        if (this.participants && this.participants[uid] && this.participants[uid].photo_50) {
            return this.participants[uid].photo_50;
        }
        return 'http://vk.com/images/camera_c.gif';
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}