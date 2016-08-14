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
        AuthHelper.addRequestListener();
        AuthHelper.addTabListener();
        this.preAuthorize();
        Observable.interval(1000).subscribe(r => {this.i++; chrome.browserAction.setBadgeText({text: String(this.i)});});



        chrome.runtime.onConnect.addListener(port => {
            if (port.name === 'messages_cache') {
                console.log('connected to port: ' + port.name);
                let key: string;
                let value: string;
                let subscription = Observable.interval(3000).subscribe(() => window.localStorage.setItem(key, value));
                
                port.onMessage.addListener(message => {
                    if (key != message['key']) {
                        window.localStorage.setItem(key, value);
                        key = message['key'];
                    }
                    value = message['value'];                    
                });
                port.onDisconnect.addListener(() => {
                    console.log('port disconnected: ' + port.name);
                    subscription.unsubscribe();
                    window.localStorage.setItem(key, value);
                })
            }
            else {
                console.log('unknown port: ' + port.name);
            }
        });
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