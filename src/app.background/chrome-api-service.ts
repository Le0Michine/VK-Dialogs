import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import "rxjs/add/Observable/fromEventPattern";
import "rxjs/add/Observable/bindCallback";

Injectable()
export class ChromeAPIService {
    private port: chrome.runtime.Port;

    /**
     * adds chrome.runtime.onConnect listener.
     * @constructor
     */
    constructor() {
        chrome.runtime.onConnect.addListener(port => this.port = port);
    }

    /**
     * chrome.runtime.onMessage listener with async response.
     * @param {string} name - Unique name of a message.
     */
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

    /**
     * chrome.runtime.sendMessage with response.
     * @param {any} message - json message.
     */
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

    /**
     * chrome.runtime.sendMessage without response.
     * @param {any} message - json message.
     */
    SendMessage(message): void {
        chrome.runtime.sendMessage(message);
    }

    /**
     * chrome.browserAction.setBadgeText
     * @param {string} value - value to set.
     */
    UpdateActionBadge(value) {
        chrome.browserAction.setBadgeText({text: value});
    }

    /**
     * creates a chrome.runtime.Port if it doesn't exist. Adds message listener to it.
     * @param {string} name - unique name of a message.
     */
    OnPortMessage(name) {
        if (!this.port) {
            this.port = chrome.runtime.connect({ name: "message_port" });
        }
        return Observable.fromEventPattern(
            handler => this.port.onMessage.addListener((message: any) => {
                if (message.name === name) {
                    console.log("got message on port: ", message);
                    handler(message);
                }
            }),
            (handler: (Object) => void) => this.port.onMessage.removeListener(handler)
        );
    }

    /**
     * posts a message via chrome.runtime.Port if it exists
     * else do nothing
     * @param {any} message - json message.
     */
    PostPortMessage(message) {
        if (this.port) {
            this.port.postMessage(message);
        }
    }

    /**
     * adds onDisconnect listener to existing port.
     * creates a port if it doesn't exist
     */
    OnDisconnect() {
        if (!this.port) {
            this.port = chrome.runtime.connect({ name: "message_port" });
        }
        return Observable.bindCallback((callback: () => void) => {
            this.port.onDisconnect.addListener(callback);
        })();
    }

    /**
     * closes existing port.
     * do nothing if port doesn't exist.
     */
    Disconnect() {
        if (this.port) {
            this.port.disconnect();
            this.port = null;
        }
    }
}