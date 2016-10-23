import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { VKService } from "./vk-service";

@Component({
    selector: "login",
    templateUrl: "login.component.html",
    styleUrls: [
        "login.component.css",
        "css/color-scheme.css",
        "css/font-style.css"
       ]
})
export class LoginComponent {
    constructor(private router: Router, private vkservice: VKService) { }

    ngOnInit() {
        console.log("login component init");
    }

    authorize() {
        this.vkservice.auth().subscribe(() => this.router.navigate(["dialogs"]));
    }
}