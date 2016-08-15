/// <reference path="../typings/globals/chrome/index.d.ts"/>
import { Component, ChangeDetectorRef } from '@angular/core';
import { HTTP_PROVIDERS } from '@angular/http';
import { ROUTER_DIRECTIVES } from '@angular/router';
import { Router } from '@angular/router';
import { Message } from './message'
import { Chat } from './message'
import { DialogComponent } from './dialog.component'
import { DialogsComponent } from './dialogs.component'
import { DialogService } from './dialogs-service'
import { UserService } from './user-service'
import { VKService } from './vk-service'
import { VKConsts } from './vk-consts'

@Component({
  selector: 'login',
  templateUrl: 'app/login.component.html',
})
export class LoginComponent { 
    title = "Authorization";
    constructor(private vkservice: VKService) { }
    authorize() {
        this.vkservice.auth(false, true);
    }
}