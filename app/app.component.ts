/// <reference path="../typings/globals/chrome/index.d.ts"/>
import { Component } from '@angular/core';
import { HTTP_PROVIDERS } from '@angular/http';
import { ROUTER_DIRECTIVES } from '@angular/router';
import { Router } from '@angular/router';
import { Dialog } from './dialog'
import { Chat } from './dialog'
import { DialogComponent } from './dialog.component'
import { DialogsComponent } from './dialogs.component'
import { MessagesService } from './messages-service'
import { UserService } from './user-service'
import { VKService } from './vk-service'
import { VKConsts } from './vk-consts'

import { messagesFromNick, messagesFromSofy } from './mock-messages'

@Component({
  selector: 'my-app',
  templateUrl: 'app/app.component.html',
  directives: [ROUTER_DIRECTIVES],
  providers: [HTTP_PROVIDERS, MessagesService, UserService, VKService],
  precompile: [DialogsComponent, DialogComponent]
})
export class AppComponent { 
    title = "Dialogs";
}