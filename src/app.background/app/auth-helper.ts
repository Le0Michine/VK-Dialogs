import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEventPattern';

import { VKConsts } from '../../app.shared/datamodels';
import { SessionInfo } from './datamodels';

export class AuthHelper {
    static clientId = 5573653;
    static authUrl = 'https://oauth.vk.com/authorize?';
    static redirectUri = 'https://oauth.vk.com/blank.html';
    static scope = 'messages,users,friends,status,offline,photos';
    static display = 'page';
    static responseType = 'token';
    static tabId: number;
    static authorizationInProgressCount = 0;
    static currentAuthorisation: Observable<any>;

    static selectTab() {
        if (AuthHelper.tabId) {
            console.log('set vk auth tab active');
            chrome.tabs.update(AuthHelper.tabId, {active: true});
        }
    }

    static authorize(forced: boolean = false): Observable<SessionInfo> {
        console.log('start authorization');
        if (AuthHelper.authorizationInProgressCount > 0) {
            console.log('another authorization in progress, cancel request');
            AuthHelper.selectTab();
            return AuthHelper.currentAuthorisation;
        }
        if (window.localStorage.getItem(VKConsts.userDenied) === 'true' && !forced) {
            console.log('authorization rejected by user');
            return <any>Observable.bindCallback((callback: (s: SessionInfo) => void) => callback(null))();
        } else {
            window.localStorage.removeItem(VKConsts.userDenied);
        }
        const authUrl: string = AuthHelper.authUrl
            + 'client_id=' + AuthHelper.clientId
            + '&scope=' + AuthHelper.scope
            + '&redirect_uri=' + AuthHelper.redirectUri
            + '&display=' + AuthHelper.display
            + '&response_type=' + AuthHelper.responseType
            + '&v=' + VKConsts.apiVersion;
        AuthHelper.authorizationInProgressCount ++;

        const observable = Observable.bindCallback((callback: (s: SessionInfo) => void) => {
            AuthHelper.addTabListener(callback);
            chrome.tabs.create({url: authUrl, active: forced}, tab => AuthHelper.tabId = tab.id);
        });
        AuthHelper.currentAuthorisation = observable();
        return AuthHelper.currentAuthorisation;
    }

    static clearSession() {
        window.localStorage.removeItem(VKConsts.vkSessionInfo);
    }

    private static addTabListener(callback) {
        chrome.tabs.onRemoved.addListener(function(tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
            if (tabId === AuthHelper.tabId) {
                AuthHelper.authorizationInProgressCount --;
            }
        });
        const o = Observable.fromEventPattern(
            (handler: (x: number, y: chrome.tabs.TabChangeInfo, z: chrome.tabs.Tab) => void) =>
                chrome.tabs.onUpdated.addListener(handler),
            (handler: (x: number, y: chrome.tabs.TabChangeInfo, z: chrome.tabs.Tab) => void) =>
                chrome.tabs.onUpdated.removeListener(handler),
            (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
                const a: any = {};
                a.tabId = tabId;
                a.changeInfo = changeInfo;
                a.tab = tab;
                return a;
            }
        );
        const s = o.subscribe((v) => {
            const tabId: number = v.tabId;
            const changeInfo: chrome.tabs.TabChangeInfo = v.changeInfo;
            const tab: chrome.tabs.Tab = v.tab;
            // tslint:disable-next-line:max-line-length
            if (tabId === AuthHelper.tabId && tab.url.split('#')[0] === AuthHelper.redirectUri && tab.status === 'complete' && changeInfo.status === 'complete') {
                console.log('found auth tab: ', tab.url);
                AuthHelper.authorizationInProgressCount --;
                AuthHelper.currentAuthorisation = null;
                const session: SessionInfo = new SessionInfo();
                const query: string[] = tab.url.split('#')[1].split('&');
                let error: any;
                for (const parameter of query) {
                    const key: string = parameter.split('=')[0];
                    const value: string = parameter.split('=')[1];

                    switch (key) {
                        case 'access_token':
                            session.accessToken = value;
                            break;
                        case 'user_id':
                            session.userId = Number(value);
                            break;
                        case 'expires_in':
                            session.tokenExp = Number(value);
                            break;
                        case 'error':
                            error = {};
                            error.error = value;
                            break;
                        case 'error_reason':
                            error.error_reason = value;
                            break;
                        case 'error_description':
                            error.error_description = value;
                            break;
                        default:
                            console.warn('unknown authorization parameter', key);
                            break;
                    }
                }
                if (error) {
                    AuthHelper.processError(error);
                    callback(null);
                } else {
                    session.timestamp = Math.floor(Date.now() / 1000);
                    console.log('store session');
                    window.localStorage.setItem(VKConsts.vkSessionInfo, JSON.stringify(session));
                }
                try {
                    chrome.tabs.remove(tabId);
                } catch (e) {
                    console.log('tab already closed');
                }
                AuthHelper.tabId = null;
                s.unsubscribe();
                callback(session);
            }
        });
    }

    private static processError(error) {
        console.log('error ocured during authorization: ', error);
        switch (error.error_reason) {
            case 'user_denied':
                console.log('user cancelled authorization request, only manual authorization is possible');
                window.localStorage.setItem(VKConsts.userDenied, 'true');
                break;
            default:
                console.error('unknown error');
                break;
        }
    }
}
