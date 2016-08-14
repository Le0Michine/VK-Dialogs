import { VKConsts } from '../app/vk-consts';
import { SessionInfo } from '../app/session-info';

export class AuthHelper {
    static client_id: number = 5573653;
    static auth_url: string = "https://oauth.vk.com/authorize?";
    static redirect_uri: string = "https://oauth.vk.com/blank.html";
    static scope: string = "messages,users,friends,status,offline";
    static display: string = "page"; 
    static response_type: string = "token";
    static tab_id: number;
    static authorization_in_progress_count: number = 0;

    static authorize(background: boolean = true) {
        console.log('start authorization');
        if (AuthHelper.authorization_in_progress_count > 0) {
            console.log('another authorisation in progress, cancel request');
            return;
        }
        AuthHelper.authorization_in_progress_count ++;
        let authUrl: string = AuthHelper.auth_url 
            + "client_id=" + AuthHelper.client_id
            + "&scope=" + AuthHelper.scope
            + "&redirect_uri=" + AuthHelper.redirect_uri
            + "&display=" + AuthHelper.display
            + "&response_type=" + AuthHelper.response_type
            + "&v=" + VKConsts.api_version;
        chrome.tabs.create({url: authUrl, selected: !background}, tab => AuthHelper.tab_id = tab.id);
    }

    static addRequestListener() {
        chrome.extension.onRequest.addListener(
            function(request, sender, sendResponse) {
                if (request.auth === 'implicit') {
                    console.log('got request about implicit authorization')
                    AuthHelper.authorize();
                }
                else if (request.auth === 'explicit') {
                    console.log('got request about explicit authorization')
                    AuthHelper.authorize(false);
                }
            }
        );
    }

    static addTabListener() {
        chrome.tabs.onUpdated.addListener(function (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
            if (tabId == AuthHelper.tab_id && tab.url.split('#')[0] === AuthHelper.redirect_uri && tab.status === 'complete') {
                console.log('found auth tab');
                let session: SessionInfo = new SessionInfo();
                let query: string[] = tab.url.split('#')[1].split('&');
                for (let parameter of query) {
                    let key: string = parameter.split('=')[0]; 
                    let value: string = parameter.split('=')[1];

                    switch (key) {
                        case 'access_token':
                            session.access_token = value;
                            window.localStorage.setItem(VKConsts.vk_access_token_id, value);
                            break;
                        case 'user_id':
                            session.user_id = value;
                            window.localStorage.setItem(VKConsts.vk_user_id, value);
                            break;
                        case 'expires_in':
                            session.token_exp = 86400;
                            window.localStorage.setItem(VKConsts.vk_token_expires_in_id, '86400');
                            break;
                    } 
                }
                session.timestamp = Math.floor(Date.now() / 1000);
                window.localStorage.setItem(VKConsts.vk_session_info, JSON.stringify(session));
                window.localStorage.setItem(VKConsts.vk_auth_timestamp_id, String(Math.floor(Date.now() / 1000)));
                chrome.tabs.remove(tabId);
                AuthHelper.tab_id = null;
                AuthHelper.authorization_in_progress_count --;
            }
        });
    }
}

/*
https://oauth.vk.com/blank.html#access_token=d0e5d749479a6aeedccf617f2164efee2b6329fdd8e983b66655646aeaf659ab2ad2ac3929d4fa7645a09&expires_in=0&user_id=54570222
 */