import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";

import { Channels } from "../app.background/channels";

import { User } from "./user";
import { VKService } from "./vk-service";
import { ChromeAPIService } from "../app.background/chrome-api-service";
import { SessionInfo } from "./session-info";

@Injectable()
export class UserService {
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

    initUsersUpdate() {
        this.users_observable = this.chromeapi.OnPortMessage("users_update").map(x => x.data);
    }
}