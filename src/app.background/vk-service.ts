import { Injectable, EventEmitter } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Http } from "@angular/http";
import "rxjs/add/observable/throw";
import "rxjs/add/operator/concatMap";
import "rxjs/add/operator/retry";
import "rxjs/add/operator/take";
import "rxjs/add/operator/delay";
import "rxjs/add/operator/retryWhen";
import "rxjs/add/operator/catch";
import "rxjs/add/observable/of";

import { VKConsts } from "../app/vk-consts";
import { SessionInfo } from "./datamodels/datamodels";
import { ErrorHelper } from "./error-helper";
import { AuthHelper } from "./auth-helper";
import { OptionsService } from "./options.service";

@Injectable()
export class VKService {
    onLogOff: EventEmitter<{}> = new EventEmitter();
    private sessionInfo: SessionInfo;
    private authorized: boolean = false;
    private setOnlineApiMethod = "account.setOnline";
    private lang: string;

    constructor(
        private http: Http,
        private settings: OptionsService
    ) {
        this.initializeSeesion();
        this.settings.language.subscribe(v => this.lang = v);
    }

    auth(force: boolean = false): Observable<SessionInfo> {
        console.log("authorization requested");
        if (!this.isSessionValid()) {
            let obs = AuthHelper.authorize(force);
            obs.catch(error => {
                console.error("failed to authorize: ", error);
                return Observable.of(null);
            }).subscribe(session => {
                    if (session) {
                        console.log("authorization successful");
                        this.sessionInfo = session;
                        this.authorized = true;
                    }
                },
                error => {
                    console.error("authorization failed: ", error);
                }
            );
            return obs;
        }
        else {
            this.authorized = true;
            window.localStorage.removeItem(VKConsts.userDenied);
            return Observable.of(this.sessionInfo);
        }
    }

    initializeSeesion(): void {
        this.sessionInfo = JSON.parse(window.localStorage.getItem(VKConsts.vkSessionInfo));
    }

    isAuthorized(): boolean {
        return this.authorized && this.isSessionValid();
    }

    isSessionValid(): boolean {
        this.initializeSeesion();
        return Boolean(
            this.sessionInfo
            && this.sessionInfo.accessToken
            && this.sessionInfo.timestamp
            && this.sessionInfo.userId
            && (this.sessionInfo.tokenExp === 0 || Math.floor(Date.now() / 1000) - this.sessionInfo.timestamp < this.sessionInfo.tokenExp)
        );
    }

    getSession(): Observable<SessionInfo> {
        if (!this.isSessionValid()) {
            return this.auth();
        }
        return Observable.of(this.sessionInfo);
    }

    logoff(): void {
        this.sessionInfo = null;
        window.localStorage.removeItem(VKConsts.vkSessionInfo);
        this.onLogOff.emit();
    }

    setOnline(): void {
        this.getSession().concatMap(session => {
            console.log("set online, got session: ", session);
            let uri: string = VKConsts.apiUrl + this.setOnlineApiMethod
                + "?access_token=" + session.accessToken
                + "&v=" + VKConsts.apiVersion;

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

    performAPIRequest(method: string, parameters: string): Observable<any> {
        let result = this.getSession().concatMap(session => {
            if (!session) {
                console.log("session is null, not authorized");
                this.authorized = false;
                return Observable.throw({
                    type: "Unauthorized",
                    message: "Unable to get session"
                });
            }
            let url = `${VKConsts.apiUrl}${method}?access_token=${session.accessToken}&v=${VKConsts.apiVersion}&lang=${this.lang}`;
            if (parameters) {
                url += "&" + parameters;
            }
            console.log(`perform api request to url ${url}`);
            return this.http.get(url)
                .map(response => response.json())
                .concatMap(json => ErrorHelper.checkErrors(json) || !json.response ? Observable.throw(json) : Observable.of(json.response));
        })
        .retryWhen(error => {
            console.warn("failed api request: ", error);
            return error.delay(500);
        })
        .take(100)
        .catch(error => {
            console.error(`An error occured during api request ${method} with parameters ${parameters}:`, error);
            return Observable.of({});
        });

        return result;
    }

    getCurrentUserId(): number {
        return this.sessionInfo.userId;
    }

    private handleError(error: any) {
        console.error("An error occurred", error);
    }
}