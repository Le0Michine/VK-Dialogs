import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";

import { Channels } from "../app.background/channels";

import { VKService } from "./vk-service";
import { ChromeAPIService } from "./chrome-api-service";
import { UserInfo } from "./datamodels/datamodels";

@Injectable()
export class UserService {
    constructor(private chromeapi: ChromeAPIService) { }

    getUsers(): Observable<{ [id: number]: UserInfo }> {
        let o = this.chromeapi.subscribeOnMessage("users_update").map(x => x.data);
        this.chromeapi.PostPortMessage({
            name: "get_users",
        });
        return o;
    }
}