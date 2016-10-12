import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import "rxjs/add/Observable/fromEventPattern";
import "rxjs/add/Observable/bindCallback";

Injectable()
export class ChromeAPIService {
    private port_name: string = "message_port";
    private port: chrome.runtime.Port = null;

    constructor() {
        this.init();
    }

    private init() {
        this.port = chrome.runtime.connect({ name: this.port_name });
    }

    subscribeOnMessage(on: string): Observable<any> {
        this.port.postMessage({
            name: "subscribe",
            eventName: on
        });
        return Observable.fromEventPattern(
            (handler: (Object) => void) => {
                this.AddMessageListener(this.port, on, handler);
            },
            (handler: (Object) => void) => {
                console.log("unsubscribe from: ", on);
                this.port.postMessage({
                    name: "unsubscribe",
                    eventName: on
                });
                this.port.onMessage.removeListener(handler);
            }
        );
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
            (callback: (Object) => void) => chrome.runtime.sendMessage(message, x => {
                if (chrome.runtime.lastError) {
                    console.error("error occured while send request to background: ", message);
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
     * creates a chrome.runtime.Port if it doesn't exist. Adds message listener to it.
     * @param {string} name - unique name of a message.
     */
    OnPortMessage(name): Observable<any> {
        return Observable.fromEventPattern(
            (handler: (Object) => void) => {
                this.AddMessageListener(this.port, name, handler);
            },
            (handler: (Object) => void) => {
                if (this.port) {
                    this.port.onMessage.removeListener(handler);
                }
            }
        );
    }

    /**
     * posts a message via chrome.runtime.Port if it exists
     * else do nothing
     * @param {any} message - json message.
     */
    PostPortMessage(message): void {
        console.log("post port message: ", message);
        this.port.postMessage(message);
    }

    private AddMessageListener(port, name, handler) {
        port.onMessage.addListener((message: any) => {
            if (message.name === name) {
                console.log("got message on port: ", message);
                handler(message);
            }
        });
    }
}