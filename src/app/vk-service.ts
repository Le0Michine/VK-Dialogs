import { Injectable }     from "@angular/core";
import { Http, Response } from "@angular/http";
import { Observable }     from "rxjs/Observable";
import { Router } from "@angular/router";

import { Channels } from "../app.background/channels";
import { ChromeAPIService } from "../app.background/chrome-api-service";

import { VKConsts } from "./vk-consts";
import { SessionInfo } from "./session-info";

@Injectable()
export class VKService {
    private session_info: SessionInfo;

    private handleError(error: any) {
        console.error("An error occurred", error);
    }

    constructor(private router: Router, private chromeapi: ChromeAPIService) {
        this.initializeSeesion();
    }

    auth(force: boolean = false, manual: boolean = false) {
        console.log("authorization requested");
        this.initializeSeesion();
    }

    initializeSeesion() {
        this.session_info = JSON.parse(window.localStorage.getItem(VKConsts.vk_session_info));
    }

    isSessionValid() {
        return Boolean(
            this.session_info
            && this.session_info.access_token
            && this.session_info.timestamp
            && this.session_info.token_exp
            && this.session_info.user_id
            && Math.floor(Date.now() / 1000) - this.session_info.timestamp < this.session_info.token_exp
        );
    }

    getSession(): SessionInfo {
        this.initializeSeesion();
        if (!this.isSessionValid()) {
            this.auth(true);
        }
        return this.session_info;
    }

    setOnline() {
        this.chromeapi.SendMessage({name: "set_online"})
    }
}