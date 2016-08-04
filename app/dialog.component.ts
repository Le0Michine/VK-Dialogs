import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Dialog } from './dialog'
import { Message } from './message'
import { MessagesService } from './messages-service'

import { messagesFromNick, messagesFromSofy } from './mock-messages'

@Component({
  selector: 'messges',
  templateUrl: 'app/dialog.component.html'
})
export class DialogComponent { 
    title = "Dialog";
    messages: Message[];
    sub: any;

    constructor (private messagesService: MessagesService, private route: ActivatedRoute) { }

    ngOnInit() {
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