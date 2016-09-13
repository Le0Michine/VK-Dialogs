import { Injectable, Inject } from "@angular/core";
import { Http, Response, RequestOptionsArgs, RequestOptions } from "@angular/http";
import { Observable }     from "rxjs/Observable";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/map";
import "rxjs/add/observable/throw";
import "rxjs/add/operator/catch";
import "rxjs/add/observable/of";

import { VKConsts } from "../app/vk-consts";
import { Message, Chat } from "../app/message";
import { Dialog } from "../app/dialog";
import { User } from "../app/user";

import { VKService } from "./vk-service";
import { ErrorHelper } from "./error-helper";
import { LongPollServer } from "./long-poll-server";
import { CacheService } from "./cache-service";
import { UserService } from "./user-service";

@Injectable()
export class LPSService {
    private get_lps: string = "messages.getLongPollServer";

    private server: LongPollServer = null;

    private on_message_update: any = () => {};
    private on_user_update: any = (user_ids: string) => {};

    constructor(
        private http: Http,
        private vkservice: VKService) { }

    init() {
        this.startMonitoring(Number(window.localStorage.getItem("lps_timstamp")));
    }

    subscribeOnMessagesUpdate(callback) {
        this.on_message_update = callback;
    }

    subscribeOnUserUpdate(callback) {
        this.on_user_update = callback;
    }

    private startMonitoring(ts: number = null) {
        console.log("session is valid, start monitoring");
        this.getLongPollServer().subscribe(
            server => {
                console.log("got lps: ", server);
                if (!server || !server.ts) {
                    console.log("unable to get lps server, restart in 5 seconds");
                    window.setTimeout(() => this.startMonitoring(), 5000);
                    return;
                }
                if (ts) {
                    console.log("set old timestamp: ", ts);
                    server.ts = ts;
                }
                this.nextRequest(server);
            },
            error => {
                console.log("error occured during lps request: ", error);
                console.log("restart monitoring in 5 seconds");
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
                    // this.processNewMessage(update);
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
                    console.warn(`UNKNOWN CODE OF UPDATE ${JSON.stringify(update)} in long poll response: ${JSON.stringify(json)}`);
                    break;
            }
        }
        if (messagesUpdate > 0) {
            this.on_message_update();
        }
        if (user_ids.length > 0) {
            console.log("need to update the following users: ", user_ids);
            this.on_user_update(user_ids.join());
        }
    }

    private nextRequest(server: LongPollServer) {
        this.startLongPollRequest(server)
        .catch(error => {
            console.log("error occured while lp request: ", error);
            return Observable.of({ error: true });
        })
        .subscribe(response => {
            if (response.failed === 2) {
                console.log("lps key expired need to obtain the new one");
                this.startMonitoring(server.ts);
            }
            else if (response.failed === 3) {
                console.log("error ocured need to obtain a new lps key");
                this.startMonitoring(server.ts);
            }
            else if (response.failed === 1) {
                console.log("history became obsolete need to refresh it first");
                this.on_message_update();
                // this.on_user_update();
            }
            else if (response.error) {
                console.log("error occured, stop moitoring");
            }
            else {
                console.log(new Date(Date.now()) + " got a long poll response: ", response);
                server.ts = response.ts;
                this.processLongPollResponse(response);
                this.nextRequest(server);
            }
        },
        error => {
            console.error("error occured during lp request: ", error);
            console.log("trying to reconnect");
            this.startMonitoring(server.ts);
        });
    }

    private getLongPollServer(): Observable<LongPollServer> {
        console.log("lps requested");
        return this.vkservice.performAPIRequest(this.get_lps, `use_ssl=1`)
            .timeout(35000, new Error("35s timeout occured"));
    }

    private startLongPollRequest(server: LongPollServer) {
        if (!this.vkservice.isAuthorized()) {
            console.log("unauthorized, stop monitoring");
            return Observable.throw({
                type: "Unauthorized",
                message: "User unauthorized"
            });
        }
        console.log(new Date(Date.now()) + " perform a long poll request: ", server);
        let uri: string = `http://${server.server}?act=a_check&key=${server.key}&ts=${server.ts}&wait=25&mode=2`;
        return this.http.get(uri).timeout(35000, new Error("35s timeout occured")).map(response => response.json());
    }

    /* [0: 4, 1: $message_id, 2: $flags, 3: $from_id, 4: $timestamp, 5: $subject, 6: $text, 7: $attachments] -- add a new message */
    private processNewMessage(update: string[]) {
        let id = update[1];
        let user_id = update[7]["from"];
        let chat = user_id ? true : false;
        if (!chat) user_id = update[3];
        let title = update[5];
        let text = update[6];
        let flags = Number(update[2]);
        let read_state = (flags & message_flags.UNREAD) !== message_flags.UNREAD;

        /*this.users.getUser(user_id).subscribe(user => {
            let fullName = user.first_name + " " + user.last_name;
            if (!chat) title = user.first_name + " " + user.last_name;
            this.notification.sendChromeNotification(id, text, title, chat ? fullName : null, user.photo_50);
        });*/
    }  
}

const enum message_flags {
    UNREAD = 1, OUTBOX = 2, REPLIED = 4, IMPORTANT = 8, CHAT = 16, FRIENDS = 32, SPAM = 64, DELЕTЕD = 128, FIXED = 256, MEDIA = 512
};