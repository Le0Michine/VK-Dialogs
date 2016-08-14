/// <reference path="../typings/globals/chrome/index.d.ts"/>

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HTTP_PROVIDERS, Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import { AuthHelper } from './auth-helper';
import { VKConsts } from '../app/vk-consts';
import { VKService } from '../app/vk-service';

@Component({
    selector: 'background-app',
    template: '<span>Backgrounf component</span>',
    providers: [HTTP_PROVIDERS, VKService],
    precompile: []
})
export class BackgroundComponent implements OnInit, OnDestroy {
    i: number = 0;

    constructor(private http: Http) { }

    ngOnInit() {
        console.log('background init');
        console.log(this);
        AuthHelper.addRequestListener();
        AuthHelper.addTabListener();
        this.preAuthorize();
        Observable.interval(1000).subscribe(r => {this.i++; chrome.browserAction.setBadgeText({text: String(this.i)});});
    }

    ngOnDestroy() {
        console.log('background destroy');
    }

    private preAuthorize() {
        if (!window.localStorage.getItem(VKConsts.vk_access_token_id) || !window.localStorage.getItem(VKConsts.vk_auth_timestamp_id)) {
            console.log('unable to find auth session data');
            AuthHelper.authorize(false);        
        }
        else if ((Math.floor(Date.now() / 1000) - Number(window.localStorage.getItem(VKConsts.vk_auth_timestamp_id))) > 86400) {
            console.log('session expired, reauthorize');
            AuthHelper.authorize();
        }
    }
}