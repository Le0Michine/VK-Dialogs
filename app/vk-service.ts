/// <reference path="../typings/globals/chrome/index.d.ts"/>
import { Injectable }     from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable }     from 'rxjs/Observable';
import { Router } from '@angular/router';

import { Channels } from '../app.background/channels';

import { VKConsts } from './vk-consts';
import { SessionInfo } from './session-info';
import { RequestHelper } from './request-helper';

@Injectable()
export class VKService {
    private session_info: SessionInfo;

    private handleError(error: any) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }

    constructor(private router: Router) {
        this.initializeSeesion();
    }

    auth(force: boolean = false, manual: boolean = false) {
        console.log('authorization requested');
        this.initializeSeesion();
        RequestHelper.sendRequestToBackground({
            name: Channels.get_session_request,
            force_auth: force,
            requested_by_user: manual
        }).subscribe(s => this.session_info = s);
    }

    initializeSeesion() {
        this.session_info = eval('('+window.localStorage.getItem(VKConsts.vk_session_info)+')');
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
        if (!this.isSessionValid()) {
            this.auth(true);
        }
        return this.session_info;
    }
}

// https://oauth.vk.com/authorize?client_id=5573653&scope=messages&redirect_uri=https://oauth.vk.com/blank.html&display=page&response_type=token&v=5.53