import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs, RequestOptions } from '@angular/http';
import { Observable }     from 'rxjs/Rx';
import 'rxjs/add/operator/timeout';

import { VKConsts } from '../app/vk-consts';
import { Message, Chat } from '../app/message';
import { Dialog } from '../app/dialog';
import { User } from '../app/user';

import { VKService } from './vk-service';
import { ErrorHelper } from './error-helper';
import { LongPollServer } from './long-poll-server';
import { LPSHelper } from './lps-helper';
import { CacheService } from './cache-service';
import { UserService } from './user-service';

@Injectable()
export class LPSService {
    private get_lps: string = 'messages.getLongPollServer';

    private server: LongPollServer = null;

    private on_message_update: any = () => {};
    private on_user_update: any = (user_ids: string) => {};

    constructor(private http: Http, private vkservice: VKService) {
        this.startMonitoring();
    }

    subscribeOnMessagesUpdate(callback) {
        this.on_message_update = callback;
    }

    subscribeOnUserUpdate(callback) {
        this.on_user_update = callback;
    }

    private startMonitoring(ts: number = null) {
        console.log('session is valid, start monitoring');
        this.getLongPollServer().subscribe(
            server => {
                if (ts) {
                    server.ts = ts;
                }
                this.nextRequest(server);
            },
            error => {
                console.log('error ocured during lps request: ', error);
                console.log('restart monitoring in 5 seconds');
                window.setTimeout(() => this.startMonitoring(), 5000);
            });
    }

    private processLongPollResponse(json) {
        let updates = json.updates;
        let messagesUpdate = 0;
        let user_ids = [];
        for (let update of updates) {
            switch (update[0]) {
                case 0: 
                    /* 0,$message_id,0 -- delete a message with the local_id indicated */
                    messagesUpdate++;
                    break;
                case 1: 
                    /* 1,$message_id,$flags -- replace message flags (FLAGS:=$flags) */
                    messagesUpdate++;
                    break;
                case 2: 
                    /* 2,$message_id,$mask[,$user_id] -- install message flags (FLAGS|=$mask) */
                    messagesUpdate++;
                    break;
                case 3: 
                    /* 3,$message_id,$mask[,$user_id] -- reset message flags (FLAGS&=~$mask) */
                    messagesUpdate++;
                    break;
                case 4: 
                    /* 4,$message_id,$flags,$from_id,$timestamp,$subject,$text,$attachments -- add a new message */
                    messagesUpdate++;
                    break;
                case 6: 
                    /* 6,$peer_id,$local_id -- read all incoming messages with $peer_id until $local_id */
                    messagesUpdate++;
                    break;
                case 7: 
                    /* 7,$peer_id,$local_id -- read all outgoing messages with $peer_id until $local_id */
                    messagesUpdate++;
                    break;
                case 8: 
                    /* 8,-$user_id,$extra -- a friend of $user_id is online, $extra is not 0 if flag 64 was transmitted in mode.
                    $extra mod 256 is a platform id (see the list below) */
                    user_ids.push(-Number(update[1]));
                    break;
                case 9: 
                    /* 9,-$user_id,$flags -- a friend of $user_id is offline 
                    ($flags equals 0 if the user has left the site 
                    (for example, clicked on "Log Out"), 
                    and 1 if offline upon timeout (for example, the status is set to "away")) */
                    user_ids.push(-Number(update[1]));
                    break;
                case 51: 
                    /* 51,$chat_id,$self -- one of $chat_id's parameters (title, participants) was changed. 
                    $self shows if changes were made by user themself */
                    messagesUpdate++;
                    break;
                case 61:
                    /* 61,$user_id,$flags -- $user_id started typing text in a dialog. 
                    The event is sent once in ~5 sec while constantly typing. $flags = 1 */
                    break;
                case 62: 
                    /* 62,$user_id,$chat_id — $user_id started typing in $chat_id. */
                    break;
                case 70: 
                    /* 70,$user_id,$call_id — $user_id made a call with $call_id identifier. */
                    break;
                case 80: 
                    /* 80,$count,0 — new unread messages counter in the left menu equals $count. */
                    break;
                case 114: 
                    /* 114,{ $peerId, $sound, $disabled_until } — notification settings changed, 
                    where peerId is a chat's/user's $peer_id, 
                    sound — 1 || 0, sound notifications on/off, 
                    disabled_until — notifications disabled for a certain period 
                    (-1: forever; 0: notifications enabled; other: timestamp for time to switch back on). */
                    break;
                default:
                    console.log('unknow code of update ' +  JSON.stringify(update) + ' in long poll response: ' + JSON.stringify(json));
                    break;
            }
        }
        if (messagesUpdate > 0) {
            this.on_message_update();
        }
        if (user_ids.length > 0) {
            console.log('need to update the following users: ', user_ids);
            this.on_user_update(user_ids.join());
        }
    }

    private nextRequest(server: LongPollServer) {
        this.startLongPollRequest(server).subscribe(response => {
            if (response.failed === 2) {
                console.log('lps key expired need to obtain the new one');
                this.startMonitoring(server.ts);
            }
            else if (response.failed === 3) {
                console.log('error ocured need to obtain a new lps key');
                this.startMonitoring(server.ts);
            }
            else if (response.failed === 1) {
                console.log('history became obsolet need to refresh it first');
                this.on_message_update();
                //this.on_user_update();
            }
            else {
                console.log(new Date(Date.now()) + ' got a long poll response: ' + JSON.stringify(response));
                server.ts = response.ts;
                this.processLongPollResponse(response);
                this.nextRequest(server);
            }
        },
        error => {
            console.log('error ocured during lp request: ', error);
            console.log('trying to reconnect');
            this.startMonitoring(server.ts);
        });
    }

    private getLongPollServer(): Observable<LongPollServer> {
        console.log('lps requested');
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_lps
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&use_ssl=1";
            return this.http.get(uri).timeout(35000, new Error('35s timeout occured')).map(response => response.json().response);
        });
    }

    private startLongPollRequest(server: LongPollServer) {
        console.log(new Date(Date.now()) + ' perform a long poll request');
        let uri: string = "http://" + server.server + "?act=a_check&key=" + server.key + "&ts=" + server.ts + "&wait=25&mode=2";
        return this.http.get(uri).timeout(35000, new Error('35s timeout occured')).map(response => response.json());
    }
}