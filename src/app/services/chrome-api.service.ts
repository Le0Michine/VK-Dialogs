import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/fromEventPattern";
import "rxjs/add/observable/bindCallback";

@Injectable()
export class ChromeAPIService {
    private portName: string = "message_port";
    private port: chrome.runtime.Port = null;

    constructor() {
        this.port = chrome.runtime.connect({ name: this.portName });
    }

    subscribeOnMessage(on: string): Observable<any> {
        this.port.postMessage({
            name: "subscribe",
            eventName: on
        });
        return Observable.fromEventPattern(
            (handler: (o: Object) => void) => {
                this.AddMessageListener(this.port, on, handler);
            },
            (handler: (o: Object) => void) => {
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
            (handler: (o: Object) => void) => chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.name === name) {
                    console.log("got message", message);
                    message.sendResponse = sendResponse;
                    message.sender = sender;
                    handler(message);
                    return true;
            }}),
            (handler: (o: Object) => void) => chrome.runtime.onMessage.removeListener(handler)
        );
    }

    /**
     * chrome.runtime.sendMessage with response.
     * @param {any} message - json message.
     */
    SendRequest(message): Observable<any> {
        console.log("send request to background", message, chrome.runtime.lastError);
        return Observable.bindCallback(
            (callback: (o: Object) => void) => chrome.runtime.sendMessage(message, x => {
                console.log("got request response", message);
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
            (handler: (o: Object) => void) => {
                this.AddMessageListener(this.port, name, handler);
            },
            (handler: (o: Object) => void) => {
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

    isCurrentWindowMinimized(): Observable<boolean> {
        return Observable.create(observer => {
            chrome.windows.getCurrent((chromeWindow) => {
                console.log("current window state", chromeWindow.state);
                observer.next(chromeWindow.state === "minimized");
                observer.complete();
            });
        });
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