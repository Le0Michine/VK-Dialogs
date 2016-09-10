import { Injectable }     from "@angular/core";
import { Observable }     from "rxjs/Observable";
import { Http }     from "@angular/http";
import "rxjs/add/operator/concatMap";
import "rxjs/add/operator/retry";
import "rxjs/add/operator/catch";

import { VKConsts } from "../app/vk-consts";
import { SessionInfo } from "../app/session-info";
import { ErrorHelper } from "./error-helper";
import { AuthHelper } from "./auth-helper";

@Injectable()
export class VKService {
    private session_info: SessionInfo;

    private set_online = "account.setOnline";

    private handleError(error: any) {
        console.error("An error occurred", error);
        // return Promise.reject(error.message || error);
    }

    constructor(private http: Http) {
        this.initializeSeesion();
    }

    auth(force: boolean = false) {
        console.log("authorization requested");
        this.initializeSeesion();
        if (!this.isSessionValid()) {
            let force = this.session_info ? false : true;
            let obs = AuthHelper.authorize(force);
            obs.subscribe(session => {
                if (session) {
                    this.session_info = session;
                }
            });
            return obs;
        }
    }

    initializeSeesion() {
        this.session_info = JSON.parse(window.localStorage.getItem(VKConsts.vk_session_info));
    }

    isSessionValid() {
        this.initializeSeesion();
        return Boolean(
            this.session_info
            && this.session_info.access_token
            && this.session_info.timestamp
            && this.session_info.token_exp
            && this.session_info.user_id
            && !this.session_info.isExpired
        );
    }

    getSession(): Observable<SessionInfo> {
        if (!this.isSessionValid()) {
            let background: boolean = this.session_info ? this.session_info.isExpired() : false;
            return this.auth(background);
        }
        return Observable.of(this.session_info);
    }

    logoff() {
        this.session_info = null;
        window.localStorage.removeItem(VKConsts.vk_session_info)
    }

    setOnline() {
        this.getSession().concatMap(session => {
            console.log("set online, got session: ", session);
            if (!session) {

            }
            let uri: string = VKConsts.api_url + this.set_online
                + "?access_token=" + session.access_token
                + "&v=" + VKConsts.api_version;

            return this.http.get(uri).map(response => response.json()).map(json => ErrorHelper.checkErrors(json) ? null : json.response);
            /** response: {count: number, items: Message[]} */
        }).subscribe((result => {
            if (result === 1) {
                console.log("user online");
            }
            else {
                console.log("filed to set online");
            }
        },
        error => console.error("Error occured while setting online: ", error),
        () => console.log("set online reqest completed")));
    }

    performAPIRequest(method: string, parameters: string) {
        return this.getSession().concatMap(session => {
            if (!session) {
                Observable.throw("Unable to get session");
            }
            let url = `${VKConsts.api_url}${method}?access_token=${session.access_token}&v=${VKConsts.api_version}`;
            if (parameters) {
                url += "&" + parameters;
            }
            console.log(`perform api request to url ${url}`);
            return this.http.get(url)
                .map(response => response.json())
                .map(json => ErrorHelper.checkErrors(json) ? {} : (json.response ? json.response : json));
        }).retry(5)
        .catch(error => {
            console.error(`An error occured during api request ${method} with parameters ${parameters}:`, error);
            return Observable.of({});
        });
    }

    getCurrentUserId() {
        return this.session_info.user_id;
    }
}