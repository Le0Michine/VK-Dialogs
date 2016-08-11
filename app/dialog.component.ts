import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Message } from './message'
import { User } from './user'
import { MessagesService } from './messages-service'
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
    user: User = new User();
    messages: Message[];
    sub: any;

    constructor (private messagesService: MessagesService,
      private vkservice: VKService, 
      private userService: UserService, 
      private route: ActivatedRoute) { }

    ngOnInit() {
      this.userService.getUser().subscribe(
            u => this.user = u, 
            error => this.errorHandler(error), 
            () => console.log('user data obtained'));
      this.sub = this.route.params.subscribe(params => {
        let id = +params['id'];
        let type = params['type'];
        this.messagesService.getMessages(id, type)
          .then(m => this.messages = m);
      });
    }

    ngOnDestroy() {
      this.sub.unsubscribe();
    }

    goBack() {
      window.history.back();
    }

    auth() {
      this.vkservice.auth();
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}