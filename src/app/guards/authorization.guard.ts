import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";

import { VKService } from "../services";
import { VKConsts } from "../vk-consts";

@Injectable()
export class AuthorizationGuard implements CanActivate {

    constructor(private login: VKService, private router: Router) { }

    canActivate() {
        if (window.localStorage.getItem(VKConsts.userDenied) === "true" || !this.login.hasValidSession()) {
            this.router.navigate(["authorize"]);
        }
        return true;
    }

}