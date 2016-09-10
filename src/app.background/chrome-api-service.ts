import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import "rxjs/add/Observable/fromEventPattern";
import "rxjs/add/Observable/bindCallback";

Injectable()
export class ChromeAPIService {
    OnMessage(name: string): Observable<any> {
        return Observable.fromEventPattern(
            (handler: (Object) => void) => chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.name === name) {
                    console.log("got message", message);
                    message.sendResponse = sendResponse;
                    message.sender = sender;
                    handler(message);
                    return true;
            }}),
            (handler: (Object) => void) => chrome.runtime.onMessage.removeListener(handler)
        );
    }

    SendRequest(message): Observable<any> {
        return Observable.bindCallback(
            (callback: (Object) => void) => chrome.runtime.sendMessage(message, (x) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                }
                callback(x);
            })
        )();
    }

    SendMessage(message): void {
        chrome.runtime.sendMessage(message);
    }
}