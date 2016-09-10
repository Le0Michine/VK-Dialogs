import { Injectable } from "@angular/core";
import { Observable }     from "rxjs/Observable";
import "rxjs/add/Observable/fromEventPattern";

import { Channels } from "../app.background/channels";

import { User } from "./user";
import { VKService } from "./vk-service";
import { ChromeAPIService } from "../app.background/chrome-api-service";
import { SessionInfo } from "./session-info";

@Injectable()
export class UserService {
    private users_port: chrome.runtime.Port;

    users_observable: Observable<{}>;

    constructor(private vkservice: VKService, private chromeapi: ChromeAPIService) {
        this.initUsersUpdate();
    }

    private getUsers(uids: string): Observable<{}> {
        console.log("users requested");
        return this.chromeapi.SendRequest({
            name: Channels.get_multiple_users_request,
            user_ids: uids
        }).map(x => x.data);
    }

    getUser(uid: number = null): Observable<User> {
        console.log("one user requested");
        return this.chromeapi.SendRequest({
            name: Channels.get_user_request,
            user_id: uid
        }).map(x => x.data);
    }

    requestUsers() {
        this.users_port.postMessage({name: Channels.get_users_request});
    }

    initUsersUpdate() {
        this.users_port = chrome.runtime.connect({name: "users_monitor"});
        this.users_observable = Observable.fromEventPattern(
            (h: (x: User[]) => void) => this.users_port.onMessage.addListener((message: any) => {
                if (message.name === "users_update" && message.data) {
                    console.log("got users_update message");
                    h(message.data as User[]);
                }
                else {
                    console.log("unknown message in users_monitor: " + JSON.stringify(message));
                }
            }),
            (h: (x: User[]) => void) => this.users_port.onMessage.removeListener(h)
        );
    }
}