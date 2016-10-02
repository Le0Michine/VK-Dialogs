import { Component } from "@angular/core";
import { VKService } from "./vk-service";

@Component({
  selector: "login",
  templateUrl: "login.component.html",
  styleUrls: [ "login.component.css" ]
})
export class LoginComponent {
    constructor(private vkservice: VKService) { }

    authorize() {
        this.vkservice.auth();
    }
}