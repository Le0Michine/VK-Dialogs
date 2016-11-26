import { Injectable, EventEmitter } from "@angular/core";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs/Observable";
import { ConnectableObservable } from "rxjs/Observable/ConnectableObservable";
import { Subject } from "rxjs/Subject";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Http, Headers, RequestOptions, RequestMethod, RequestOptionsArgs } from "@angular/http";
import "rxjs/add/observable/of";
import "rxjs/add/observable/throw";
import "rxjs/add/operator/buffer";
import "rxjs/add/operator/catch";
import "rxjs/add/operator/concatMap";
import "rxjs/add/operator/delay";
import "rxjs/add/operator/distinct";
import "rxjs/add/operator/distinctUntilChanged";
import "rxjs/add/operator/publish";
import "rxjs/add/operator/retry";
import "rxjs/add/operator/retryWhen";
import "rxjs/add/operator/switchMap";
import "rxjs/add/operator/take";

import { VKConsts } from "../../app/vk-consts";
import { SessionInfo } from "../datamodels";
import { ErrorHelper } from "../error-helper";
import { AuthHelper } from "../auth-helper";
import { OptionsService } from "./options.service";
import { AppBackgroundState } from "../app-background.store";
import { logoff, login } from "../actions";

@Injectable()
export class VKService {
    private sessionInfo: SessionInfo;
    private authorized: boolean = false;
    private setOnlineApiMethod = "account.setOnline";
    private setActivityApiMethod = "messages.setActivity";
    private lang: string;
    private requestScheduler: Subject<any> = new Subject();
    private requestId: number = 0;
    private httpRequest: Subject<any> = new Subject();

    constructor(
        private store: Store<AppBackgroundState>,
        private http: Http,
        private settings: OptionsService
    ) {
        this.initializeSeesion();
        this.settings.language.subscribe(v => this.lang = v);
        this.requestScheduler
            .buffer(Observable.interval(334))
            .filter(x => x.length > 0)
            .concatMap(requests => this.getSession().map(session => ({ session, requests })))
            .concatMap(({ session, requests }) => this.createUrl(session, requests))
            .concatMap(url => this.performHttpRequest(url))
            .subscribe(r => this.httpRequest.next(r));
    }

    auth(force: boolean = false): Observable<SessionInfo> {
        console.log("authorization requested");
        if (!this.isSessionValid()) {
            let obs = AuthHelper.authorize(force);
            obs.catch(error => {
                console.error("failed to authorize: ", error);
                this.store.dispatch(logoff());
                return Observable.of(null);
            }).subscribe(session => {
                    if (session) {
                        console.log("authorization successful");
                        this.sessionInfo = session;
                        this.authorized = true;
                        this.store.dispatch(login());
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
            this.store.dispatch(login());
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
        this.store.dispatch(logoff());
    }

    setActive() {
        // TODO: implement
    }

    setOnline(): void {
        this.getSession().concatMap(session => {
            console.log("set online, got session: ", session);
            let uri: string = VKConsts.apiUrl + this.setOnlineApiMethod
                + "?access_token=" + session.accessToken
                + "&v=" + VKConsts.apiVersion;

            return this.http.get(uri).map(response => response.json()).map(json => ErrorHelper.checkErrors(json) ? null : json.response);
            /** response: {count: number, items: Message[]} */
        }).subscribe(result => {
            if (result === 1) {
                console.log("user online");
            }
            else {
                console.log("filed to set online");
            }
        },
        error => console.error("Error occured while setting online: ", error),
        () => console.log("set online reqest completed"));
    }

    performAPIRequestsBatch(method: string, parameters: {}): Observable<any> {
        console.log("perform api request", method, parameters);
        let id = this.requestId++;
        this.requestId = this.requestId % 999999;
        this.requestScheduler.next({ id, method, parameters });
        return this.httpRequest.filter(r => Boolean(r[id])).take(1).map(r => r[id]);
    }

    performSingleAPIRequest(method: string, parameters: any): Observable<any> {
        let parametersArray = [];
        for (let p of Object.keys(parameters)) {
            parametersArray.push(`${p}=${parameters[p]}`);
        }
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
            if (parametersArray.length) {
                url += "&" + parametersArray.join("&");
            }
            console.log(`perform api request to url ${url}`);
            return Observable.of(url);
        })
        .concatMap(url => this.http.get(url))
        .map(response => response.json())
        .concatMap(json => ErrorHelper.checkErrors(json) || !json.response ? Observable.throw(json) : Observable.of(json.response))
        .retryWhen(error => {
            console.warn("failed api request: ", error);
            return error.delay(500);
        })
        .take(100);
        // .catch(error => {
        //     console.error(`An error occured during api request ${method} with parameters ${parameters}:`, error);
        //     return Observable.of({});
        // });

        return result;
    }

    getCurrentUserId(): number {
        return this.sessionInfo.userId;
    }

    private performHttpRequest(url: string) {
        console.log(`%c[${this.getTimeStamp()}] http request ${url}`, "font-weight: bold; color: blue");
        return this.http.get(url)
            .map(response => response.json())
            .concatMap(json => ErrorHelper.checkErrors(json) || !json.response ? Observable.throw(json) : Observable.of(json.response))
            .retryWhen(error => {
                console.warn(`[${this.getTimeStamp()}] failed api request, retry:`, error);
                return error.delay(500);
            })
            .take(100)
            .catch(error => {
                console.error(`An error occured during api request:`, error);
                return Observable.of({});
            });
    }

    private createUrl(session: SessionInfo, requests: any[]) {
        console.log("perform requests:", session, requests);
        if (!session) {
            console.log("session is null, not authorized");
            this.authorized = false;
            return Observable.throw({
                type: "Unauthorized",
                message: "Unable to get session"
            });
        }

        let requestsBatch = requests.map(r => {
            let params = Object.assign({}, r.parameters);
            let url = `API.${r.method}(${JSON.stringify(params)})`;
            return { id: r.id, url };
        }).map(r => `"${r.id}": ${r.url}`).join(", ");
        let url = `${VKConsts.apiUrl}execute?access_token=${session.accessToken}&v=${VKConsts.apiVersion}&lang=${this.lang}&code=return {${requestsBatch}};`;

        return Observable.of(url);
    }

    private handleError(error: any) {
        console.error("An error occurred", error);
    }

    private getTimeStamp() {
        let date = new Date(Date.now());
        return date.toLocaleTimeString() + "." + date.getMilliseconds();
    }
}