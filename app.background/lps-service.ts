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

    server: LongPollServer = null;

    constructor(private http: Http, private vkservice: VKService) {
        this.startMonitoring();
    }

    startMonitoring(ts: number = null) {
        console.log('session is valid, start monitoring');
        this.getLongPollServer().subscribe(
            server => {
                if (ts) {
                    server.ts = ts;
                }
                this.nextRequest(server);
            },
            error => {
                console.log('error ocured during lps request: ' + error);
                console.log('restart monitoring');
                this.startMonitoring();
            });
    }

    processLongPollResponse(json) {
        let updates = json.updates;
        for (let update of updates) {
            switch (update[0]) {
                case 0: 
                    /* 0,$message_id,0 -- delete a message with the local_id indicated */
                    break;
                case 1: 
                    /* 1,$message_id,$flags -- replace message flags (FLAGS:=$flags) */
                    break;
                case 2: 
                    /* 2,$message_id,$mask[,$user_id] -- install message flags (FLAGS|=$mask) */
                    break;
                case 3: 
                    /* 3,$message_id,$mask[,$user_id] -- reset message flags (FLAGS&=~$mask) */
                    break;
                case 4: 
                    /* 4,$message_id,$flags,$from_id,$timestamp,$subject,$text,$attachments -- add a new message */
                    let message = LPSHelper.processMessage(update);
                    this.cache.pushMessage(message);
                    if (this.update_dialogs_port) {
                        this.postDialogsUpdate();
                    }
                    if (this.update_messages_port && this.current_dialog_id 
                        && (message['chat_id'] === this.current_dialog_id || message.user_id === this.current_dialog_id)) {
                        this.update_messages_port.postMessage({
                            name: 'history_update', 
                            data: this.cache.messages_cache[this.current_dialog_id]
                        });
                    }
                    break;
                case 6: 
                    /* 6,$peer_id,$local_id -- read all incoming messages with $peer_id until $local_id */
                    break;
                case 7: 
                    /* 7,$peer_id,$local_id -- read all outgoing messages with $peer_id until $local_id */
                    break;
                case 8: 
                    /* 8,-$user_id,$extra -- a friend of $user_id is online, $extra is not 0 if flag 64 was transmitted in mode.
                    $extra mod 256 is a platform id (see the list below) */
                    break;
                case 9: 
                    /* 9,-$user_id,$flags -- a friend of $user_id is offline 
                    ($flags equals 0 if the user has left the site 
                    (for example, clicked on "Log Out"), 
                    and 1 if offline upon timeout (for example, the status is set to "away")) */
                    break;
                case 51: 
                    /* 51,$chat_id,$self -- one of $chat_id's parameters (title, participants) was changed. 
                    $self shows if changes were made by user themself */
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
    }

    nextRequest(server: LongPollServer) {
        this.startLongPollRequest(server).subscribe(response => {
            if (response.failed === 2) {
                console.log('lps key expired need to obtain the new one')
                this.startMonitoring(server.ts);
            }
            else if (response.failed === 3) {
                console.log('error ocured need to obtain a new lps key')
                this.startMonitoring(server.ts);
            }
            else if (response.failed === 3) {
                console.log('history became obsolet need to refresh it first')
                this.getDialogs().subscribe(dialogs => {
                    this.cache.updateDialogs(dialogs);
                    server.ts = response.ts;
                    this.nextRequest(server);
                },
                error => this.handleError(error));
            }
            else {
                console.log(new Date(Date.now()) + ' got a long poll response: ' + JSON.stringify(response));
                server.ts = response.ts;
                this.processLongPollResponse(response);
                this.nextRequest(server);
            }
        },
        error => {
            console.log('error ocured during lp request: ' + error);
            console.log('trying to reconnect');
            this.startMonitoring(server.ts);
        });
    }

    getLongPollServer(): Observable<LongPollServer> {
        console.log('lps requested');
        return this.vkservice.getSession().concatMap(session => {
            let uri: string = VKConsts.api_url + this.get_lps
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version
                + "&use_ssl=1";
            return this.http.get(uri).map(response => response.json().response);
        });
    }

    startLongPollRequest(server: LongPollServer) {
        console.log(new Date(Date.now()) + ' perform a long poll request');
        let uri: string = "http://" + server.server + "?act=a_check&key=" + server.key + "&ts=" + server.ts + "&wait=25&mode=2";
        return this.http.get(uri).timeout(35000, new Error('30s timeout ocured')).map(response => response.json());
    }
}