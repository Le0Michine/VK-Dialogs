import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import "rxjs/add/Observable/fromEventPattern";
import "rxjs/add/Observable/bindCallback";

Injectable()
export class ChromeAPIService {
    private port_name: string = "message_port";
    private is_background: boolean = false;
    private port: chrome.runtime.Port = null;

    /**
     * starts listen for chrome.runtime.onConnect.
     */
    AcceptConnections() {
        if (this.is_background) return;
        chrome.runtime.onConnect.addListener(port => {
            if (port.name === this.port_name) {
                console.log("connect to port: ", port);
                this.port = port;
                port.onDisconnect.addListener(() => this.port = null);
            }
        });
        this.is_background = true;
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
                    console.error("error occured while senf request: ", message);
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
    UpdateActionBadge(value): void {
        chrome.browserAction.setBadgeText({text: String(value)});
    }

    /**
     * creates a chrome.runtime.Port if it doesn't exist. Adds message listener to it.
     * @param {string} name - unique name of a message.
     */
    OnPortMessage(name): Observable<any> {
        return Observable.fromEventPattern(
            (handler: (Object) => void) => {
                if (!this.port) {
                    if (this.is_background) {
                        chrome.runtime.onConnect.addListener(port => {
                            if (port.name === this.port_name) {
                                this.AddMessageListener(port, name, handler);
                            }
                        });
                        return;
                    }
                    console.log("port is closed, open a new one");
                    this.port = chrome.runtime.connect({ name: this.port_name });
                }
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
        if (!this.port) {
            if (!this.is_background) {
                this.port = chrome.runtime.connect({ name: this.port_name });
            }
            else {
                console.log("port isn't connected");
                return;
            }
        }
        console.log("post port message: ", message);
        this.port.postMessage(message);
    }

    /**
     * posts a message as soon as port is connected
     * else post a message on existing port.
     * @param {any} message - json message.
     * @deprecated will be removed
     */
    PostPortMessageOnConnect(message): void {
        if (this.port) {
            this.port.postMessage(message);
        }
        else {
            chrome.runtime.onConnect.addListener(port => {
                if (port.name === this.port_name) {
                    console.log("post port message on connect: ", message);
                    port.postMessage(message);
                }
            });
        }
    }

    /**
     * adds onDisconnect listener to existing port.
     */
    OnDisconnect(): Observable<{}> {
        if (!this.port) {
            if (!this.is_background) {
                return Observable.of(null);
            }
            return Observable.bindCallback(
                (callback: () => void) => chrome.runtime.onConnect.addListener(port => {
                    if (port.name === this.port_name) {
                        port.onDisconnect.addListener(callback);
                    }
                })
            )();
        }
        return Observable.bindCallback((callback: () => void) => {
            this.port.onDisconnect.addListener(callback);
        })();
    }

    /**
     * closes existing port.
     * do nothing if port doesn't exist.
     * @deprecated will be removed
     */
    Disconnect(): void {
        if (this.port) {
            console.log("close port: ", this.port);
            this.port.disconnect();
            this.port = null;
        }
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