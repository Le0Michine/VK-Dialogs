import { Injectable }     from "@angular/core";
import { Http, Response } from "@angular/http";
import { Observable }     from "rxjs/Observable";
import { Router } from "@angular/router";

import { ChromeAPIService } from "./chrome-api.service";

import { VKConsts } from "../vk-consts";
import { SessionInfo } from "../datamodels";

@Injectable()
export class VKService {
    private sessionInfo: SessionInfo;

    constructor(private router: Router, private chromeapi: ChromeAPIService) { }

    init() {
        this.initializeSeesion();
    }

    auth() {
        console.log("authorization requested", this.sessionInfo);
        let request = this.chromeapi.SendRequest({ name: "authorize" });
        request.subscribe(() => this.initializeSeesion());
        return request;
    }

    hasValidSession() {
        console.log("check if session is valid", this.isSessionValid());
        this.initializeSeesion();
        return this.isSessionValid();
    }

    getCurrentUserId() {
        return this.sessionInfo.userId;
    }

    setOnline() {
        this.chromeapi.SendMessage({name: "set_online"});
    }

    setActive() {
        this.chromeapi.SendMessage({name: "set_active"});
    }

    private handleError(error: any) {
        console.error("An error occurred", error);
    }

    private initializeSeesion() {
        this.sessionInfo = JSON.parse(window.localStorage.getItem(VKConsts.vkSessionInfo));
    }

    private isSessionValid() {
        return Boolean(
            this.sessionInfo
            && this.sessionInfo.accessToken
            && this.sessionInfo.timestamp
            // && this.session_info.token_exp
            && this.sessionInfo.userId
            // && Math.floor(Date.now() / 1000) - this.session_info.timestamp < this.session_info.token_exp
        );
    }
}