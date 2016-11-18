import { Injectable, EventEmitter } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { ConnectableObservable } from "rxjs/Observable/ConnectableObservable";
import { Subject } from "rxjs/Subject";
import { Http } from "@angular/http";
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

@Injectable()
export class VKService {
    onLogOff: EventEmitter<{}> = new EventEmitter();
    private sessionInfo: SessionInfo;
    private authorized: boolean = false;
    private setOnlineApiMethod = "account.setOnline";
    private setActivityApiMethod = "messages.setActivity";
    private lang: string;
    private requestScheduler: Subject<any> = new Subject();
    private requestId: number = 0;
    private httpRequest: ConnectableObservable<{}>;

    constructor(
        private http: Http,
        private settings: OptionsService
    ) {
        this.initializeSeesion();
        this.settings.language.subscribe(v => this.lang = v);
        this.httpRequest = this.requestScheduler
            // .distinct(r => ({ method: r.method, parameters: JSON.stringify(r.parameters) }))
            .buffer(Observable.interval(300))
            .filter(x => x.length > 0)
            // .distinctUntilChanged((x, y) => x.map(r => r.id).join(",") === y.map(r => r.id).join(","))
            .concatMap(requests => this.getSession().map(session => ({ session, requests })))
            .concatMap(({ session, requests }) => {
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
                    let parameters = Object.assign({}, r.parameters);
                    let url = `API.${r.method}(${JSON.stringify(parameters)})`;
                    console.log(`perform api request to url ${url}`);
                    return { id: r.id, url };
                }).map(r => `"${r.id}": ${r.url}`).join(", ");
                let url = `${VKConsts.apiUrl}execute?access_token=${session.accessToken}&v=${VKConsts.apiVersion}&lang=${this.lang}&code=return {${requestsBatch}};`;
                return this.http.get(url)
                    .map(response => response.json())
                    .concatMap(json => ErrorHelper.checkErrors(json) || !json.response ? Observable.throw(json) : Observable.of(json.response));
                    // return {"6807492": API.messages.getHistory({count: 2, user_id: 6807492})};
            })
            .retryWhen(error => {
                console.warn("failed api request: ", error);
                return error.delay(500);
            })
            .take(100)
            .catch(error => {
                console.error(`An error occured during api request:`, error);
                return Observable.of({});
            }) as ConnectableObservable<{}>;

        this.httpRequest = this.httpRequest.publish();
        this.httpRequest.connect();
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

    performAPIRequest(method: string, parameters: {}): Observable<any> {
        let id = this.requestId++;
        this.requestId = this.requestId % 999999;
        this.requestScheduler.next({ id, method, parameters });
        return this.httpRequest.filter(r => Boolean(r[id])).take(1).map(r => r[id]);
    }

    performSingleAPIRequestsBatch(method: string, parameters: string): Observable<any> {
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