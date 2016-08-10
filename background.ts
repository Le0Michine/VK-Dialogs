/// <reference path="./typings/globals/chrome/index.d.ts"/>
//import {VKConsts} from './app/vk-service';
let vk_access_token: string = null;
let vk_token_exp: number = null;
let vk_user_id: number = null;
let vk_tab_id: number = null;

chrome.tabs.onUpdated.addListener(function (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    let vk_tab_id: number = window.localStorage.getItem('vk_tab_id');
    let vk_uri: string = "https://oauth.vk.com/blank.html";
    if (tab.url.split('#')[0] === vk_uri && tab.status === 'complete') {
        //alert('exp tab id=' + vk_tab_id + ' act tab id=' + tabId + ' url=' + tab.url);
        let query: string[] = tab.url.split('#')[1].split('&');
        for (let parameter of query) {
            let key: string = parameter.split('=')[0]; 
            let value: string = parameter.split('=')[1];

            switch (key) {
                case 'access_token':
                    vk_access_token = value;
                    window.localStorage.setItem('vk_access_token', value);
                    break;
                case 'user_id':
                    vk_user_id = Number(value);
                    window.localStorage.setItem('vk_user_id', value);
                    break;
                case 'expires_in':
                    vk_token_exp = Number(value);
                    window.localStorage.setItem('vk_token_expires_in', value);
                    break;
            } 
        }
        window.localStorage.setItem('vk_auth_timestamp', String(Date.now() / 1000));
        //if (Number(window.localStorage.getItem('vk_token_expires_in')) > 0) {
            chrome.tabs.remove(tabId);
        //}
        chrome.extension.sendRequest({authorised: true}, function(response) {
            console.log(response.farewell);
        });
    }
});

/*
https://oauth.vk.com/blank.html#access_token=d0e5d749479a6aeedccf617f2164efee2b6329fdd8e983b66655646aeaf659ab2ad2ac3929d4fa7645a09&expires_in=0&user_id=54570222
 */