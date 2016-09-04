import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { Message } from "./message";
import { Chat } from "./message";
import { DialogComponent } from "./dialog.component";
import { DialogsComponent } from "./dialogs.component";
import { DialogService } from "./dialogs-service";
import { UserService } from "./user-service";
import { VKService } from "./vk-service";

@Component({
  selector: "login",
  templateUrl: "login.component.html",
  styleUrls: [ "login.component.css" ]
})
export class LoginComponent {
    constructor(private vkservice: VKService) { }

    authorize() {
        this.vkservice.auth(false, true);
    }
}