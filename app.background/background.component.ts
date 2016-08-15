/// <reference path="../typings/globals/chrome/index.d.ts"/>

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HTTP_PROVIDERS, Http } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import { AuthHelper } from './auth-helper';
import { VKConsts } from '../app/vk-consts';
import { VKService } from '../app/vk-service';
import { DialogService } from './dialogs-service';
import { Channels } from './channels';

@Component({
    selector: 'background-app',
    template: '<span>Backgrounf component</span>',
    providers: [HTTP_PROVIDERS, VKService, DialogService],
    precompile: []
})
export class BackgroundComponent implements OnInit, OnDestroy {
    i: number = 0;

    constructor(private http: Http, private dialogsService: DialogService) { }

    ngOnInit() {
        console.log('background init');
        AuthHelper.addRequestListener();
        AuthHelper.addTabListener();
        this.preAuthorize();
        Observable.interval(1000).subscribe(r => {this.i++; chrome.browserAction.setBadgeText({text: String(this.i)});});

        chrome.runtime.onConnect.addListener(port => {
            if (port.name === Channels.messages_cache_port) {
                this.initMessagesCache(port);
            }
            else {
                console.log('unknown port: ' + port.name);
            }
        });

        chrome.extension.onRequest.addListener((request, sender, sendResponse) => {
            if (request.name === Channels.get_dialogs_request) {
                this.dialogsService.getDialogs().subscribe(dialogs => {
                    sendResponse({data: dialogs});
                    console.log('dialogs sent');
                });
            }
            else if (request.name === Channels.get_history_request) {
                this.dialogsService.getHistory(request.conversation_id, request.is_chat).subscribe(history => {
                    sendResponse({data: history});
                    console.log('history sent');
                });
            }
        });
    }

    initMessagesCache(port: chrome.runtime.Port) {
        console.log('connected to port: ' + port.name);
        let key: string;
        let value: string;
        let subscription = Observable.interval(3000).subscribe(() => window.localStorage.setItem(key, value));
                
        port.onMessage.addListener(message => {
            if (message['remove']) {
                window.localStorage.removeItem(message['key']);
            }
            else if (key != message['key']) {
                window.localStorage.setItem(key, value);
                key = message['key'];
            }
            value = message['value'];                    
        });
        port.onDisconnect.addListener(() => {
            console.log('port disconnected: ' + port.name);
            subscription.unsubscribe();
            window.localStorage.setItem(key, value);
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