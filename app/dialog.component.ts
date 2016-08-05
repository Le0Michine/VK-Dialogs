import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Dialog } from './dialog'
import { Message } from './message'
import { User } from './user'
import { MessagesService } from './messages-service'
import { UserService } from './user-service'

import { messagesFromNick, messagesFromSofy } from './mock-messages'

@Component({
  selector: 'messges',
  templateUrl: 'app/dialog.component.html',
  styleUrls: ['app/dialogs.component.css']
})
export class DialogComponent { 
    title = "Dialog";
    user: User;
    messages: Message[];
    sub: any;

    constructor (private messagesService: MessagesService, private userService: UserService, private route: ActivatedRoute) { }

    ngOnInit() {
      this.userService.getUser(1).then(u => this.user = u);
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
}