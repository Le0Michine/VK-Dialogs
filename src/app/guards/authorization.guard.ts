import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { Store } from "@ngrx/store";
import { go } from "@ngrx/router-store";

import { VKService } from "../services";
import { VKConsts } from "../vk-consts";
import { AppState } from "../app.store";

@Injectable()
export class AuthorizationGuard implements CanActivate {

    constructor(private login: VKService, private router: Router, private store: Store<AppState>) { }

    canActivate() {
        if (window.localStorage.getItem(VKConsts.userDenied) === "true" || !this.login.hasValidSession()) {
            this.store.dispatch(go(["authorize"]));
        }
        return true;
    }

}