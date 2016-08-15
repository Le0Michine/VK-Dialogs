import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs } from '@angular/http';
import { Observable }     from 'rxjs/Observable';

import { LongPollServer } from './long-poll-server';
import { VKConsts } from './vk-consts';
import { VKService } from './vk-service';

@Injectable()
export class LongPollServerService {
    private server_key: string = 'lps_key';
    private server_address: string = 'lps_address';
    private server_ts: string = 'lps_ts';
    private get_lps: string

    server: LongPollServer;


    constructor(
        private vkservice: VKService,
        private http: Http) { }

    private initServer() {
        let key: string = window.localStorage.getItem(this.server_key);
        let address: string = window.localStorage.getItem(this.server_address);
        let ts: number = window.localStorage.getItem(this.server_ts);

        if (!this.server) {
            if (key && address && ts) {
                this.server = new LongPollServer();
                this.server.key = key;
                this.server.server = address;
                this.server.ts = ts;
            }
            else {
                if (!this.server || !key || !address || !ts) {
                    this.server = new LongPollServer();
                    let uri: string = VKConsts.api_url + this.get_lps
                        + "?access_token=" + this.vkservice.getSession().access_token
                        + "&v=" + VKConsts.api_version
                        + "&use_ssl=1";
                    this.http.get(uri)
                        .map(response => response.json().response)
                        .subscribe(response => this.server = response);
                }
            }
        }
    }
}