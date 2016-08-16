import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs } from '@angular/http';
import { Observable }     from 'rxjs/Observable';

import { VKConsts } from '../app/vk-consts';

import { LongPollServer } from './long-poll-server';
import { VKService } from './vk-service';

@Injectable()
export class LongPollServerService {
    private vk_lps: string = 'vk_lps';
    private get_lps: string

    server: LongPollServer = null;

    constructor(
        private vkservice: VKService,
        private http: Http) { }

    private initServer() {
        this.server = eval('(' + window.localStorage.getItem(this.vk_lps) + ')');

        if (!this.server || !this.server.key || !this.server.server || !this.server.ts) {
            if (this.vkservice.getSession() == null) {
                console.log('not authorized, can\'t get poll server');
                return;
            }
            this.server = new LongPollServer();
            let uri: string = VKConsts.api_url + this.get_lps
                + "?access_token=" + this.vkservice.getSession().access_token
                + "&v=" + VKConsts.api_version
                + "&use_ssl=1";
            this.http.get(uri)
                .map(response => response.json().response)
                .subscribe(response => {
                    this.server = response;
                });
        }
    }

    public getServer(): LongPollServer {
        return this.server;
    }

    public getUpdate() {
        
    }
}