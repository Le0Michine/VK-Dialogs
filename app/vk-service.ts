/// <reference path="../typings/globals/chrome/index.d.ts"/>
import { Injectable }     from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable }     from 'rxjs/Observable';

import { VKConsts } from './vk-consts';
import { SessionInfo } from './session-info';

@Injectable()
export class VKService {
    private session_info: SessionInfo;

    constructor(private http: Http) { }

    private handleError(error: any) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }

    auth(force: boolean = false) {
        this.initializeSeesion();
        if (!this.isSessionValid()) {
            let authUrl: string = VKConsts.auth_url 
                + "client_id=" + VKConsts.client_id
                + "&scope=" + VKConsts.scope
                + "&redirect_uri=" + VKConsts.redirect_uri
                + "&display=" + VKConsts.display
                + "&response_type=" + VKConsts.response_type
                + "&v=" + VKConsts.api_version;
            chrome.tabs.create({
                url: authUrl,
                selected: false
                },
                function(tab) {
                    //VKConsts.tab_id = tab.id;
                    //window.localStorage.setItem(VKConsts.tab_id.toString(), tab.id.toString());
                }
            )
        }
        else {
            console.log('already authorised');
        }
    }

    initializeSeesion() {
        this.session_info = new SessionInfo();
        this.session_info.access_token = window.localStorage.getItem(VKConsts.vk_access_token_id);
        this.session_info.user_id = window.localStorage.getItem(VKConsts.vk_user_id);
        this.session_info.token_exp = window.localStorage.getItem(VKConsts.vk_token_expires_in_id);
        this.session_info.timestamp = window.localStorage.getItem(VKConsts.vk_auth_timestamp_id);
    }

    isSessionValid() {
        return Boolean(
            this.session_info 
            && this.session_info.access_token 
            && this.session_info.timestamp
            //&& this.session_info.token_exp
            && this.session_info.user_id
            //&& (Date.now() / 1000) - this.session_info.timestamp < this.session_info.token_exp
        );
    }

    getSession(): SessionInfo {
        if (!this.isSessionValid()) {
            this.auth();
            chrome.extension.onRequest.addListener(
                function(request, sender, sendResponse) {
                    if (request.authorised) {
                        this.initialize_seesion();
                    }
                }
            );   
        }
        return this.session_info;
    }
}

// https://oauth.vk.com/authorize?client_id=5573653&scope=messages&redirect_uri=https://oauth.vk.com/blank.html&display=page&response_type=token&v=5.53