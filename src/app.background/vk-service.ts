import { Injectable }     from "@angular/core";
import { Observable }     from "rxjs/Observable";
import "rxjs/add/Observable/bindCallback";

import { VKConsts } from "../app/vk-consts";
import { SessionInfo } from "../app/session-info";

import { AuthHelper } from "./auth-helper";

@Injectable()
export class VKService {
    private session_info: SessionInfo;

    private handleError(error: any) {
        console.error("An error occurred", error);
        // return Promise.reject(error.message || error);
    }

    constructor() {
        this.initializeSeesion();
    }

    auth(force: boolean = false) {
        console.log("authorization requested");
        this.initializeSeesion();
        if (!this.isSessionValid()) {
            let force = this.session_info ? false : true;
            let obs = AuthHelper.authorize(force);
            obs.subscribe(session => {
                if (session) {
                    this.session_info = session;
                }
            });
            return obs;
        }
    }

    initializeSeesion() {
        this.session_info = JSON.parse(window.localStorage.getItem(VKConsts.vk_session_info));
    }

    isSessionValid() {
        this.initializeSeesion();
        return Boolean(
            this.session_info
            && this.session_info.access_token
            && this.session_info.timestamp
            && this.session_info.token_exp
            && this.session_info.user_id
            && !this.session_info.isExpired
        );
    }

    getSession(): Observable<SessionInfo> {
        if (!this.isSessionValid()) {
            let background: boolean = this.session_info ? this.session_info.isExpired() : false;
            return this.auth(background);
        }
        return Observable.of(this.session_info);
    }

    logoff() {
        this.session_info = null;
        window.localStorage.removeItem(VKConsts.vk_session_info)
    }
}