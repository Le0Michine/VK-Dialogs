/// <reference path="./typings/globals/chrome/index.d.ts"/>
//import {VKConsts} from './app/vk-service';
let vk_access_token: string = 'vk_access_token';
let vk_token_exp: string = 'vk_token_expires_in';
let vk_user_id: string = 'vk_user_id';
let vk_auth_timestamp: string = 'vk_auth_timestamp';
let vk_tab_id: number = null;

let auth_url: string = "https://oauth.vk.com/authorize?"; 
let redirect_uri: string = "https://oauth.vk.com/blank.html"; 
let client_id: number = 5573653; 
let scope: string = "messages,users,friends,status,offline"; 
let display: string = "page"; 
let response_type: string = "token"; 
let api_version: number = 5.53; 

if (!window.localStorage.getItem(vk_access_token)
        || !window.localStorage.getItem(vk_auth_timestamp)) {
    console.log('unable to find auth session data');
    authorize(false);        
}
else if ((Math.floor(Date.now() / 1000) - Number(window.localStorage.getItem(vk_auth_timestamp))) > 86400) {
    console.log('session expired, reauthorize');
    authorize();
}

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if (request.auth === 'implicit') {
            console.log('get request about implicit authorization')
            authorize();
        }
        else if (request.auth === 'explicit') {
            console.log('get request about explicit authorization')
            authorize(false);
        }
    }
);

chrome.tabs.onUpdated.addListener(function (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (tabId == vk_tab_id && tab.url.split('#')[0] === redirect_uri && tab.status === 'complete') {
        console.log('found auth tab');
        let query: string[] = tab.url.split('#')[1].split('&');
        for (let parameter of query) {
            let key: string = parameter.split('=')[0]; 
            let value: string = parameter.split('=')[1];

            switch (key) {
                case 'access_token':
                    window.localStorage.setItem(vk_access_token, value);
                    break;
                case 'user_id':
                    window.localStorage.setItem(vk_user_id, value);
                    break;
                case 'expires_in':
                    window.localStorage.setItem(vk_token_exp, '86400');
                    break;
            } 
        }
        window.localStorage.setItem(vk_auth_timestamp, String(Math.floor(Date.now() / 1000)));
        //if (Number(window.localStorage.getItem('vk_token_expires_in')) > 0) {
            chrome.tabs.remove(tabId);
        //}
        vk_tab_id = null;
        
    }
});

function authorize(background: boolean = true) {
    let authUrl: string = auth_url 
                + "client_id=" + client_id
                + "&scope=" + scope
                + "&redirect_uri=" + redirect_uri
                + "&display=" + display
                + "&response_type=" + response_type
                + "&v=" + api_version;
    chrome.tabs.create({url: authUrl, selected: !background}, tab => vk_tab_id = tab.id);
}

/*
https://oauth.vk.com/blank.html#access_token=d0e5d749479a6aeedccf617f2164efee2b6329fdd8e983b66655646aeaf659ab2ad2ac3929d4fa7645a09&expires_in=0&user_id=54570222
 */