import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/Observable/fromEventPattern";
import "rxjs/add/Observable/bindCallback";

Injectable()
export class ChromeAPIService {
    private port_name: string = "message_port";
    private port: chrome.runtime.Port = null;

    private subscriptions_counter = {};
    private bindings = [];

    onUnsubscribe = new Subject();

    /**
     * starts listen for chrome.runtime.onConnect.
     */
    AcceptConnections() {
        chrome.runtime.onConnect.addListener(port => {
            if (port.name === this.port_name) {
                console.log("connect to port: ", port);
                this.port = port;
                port.onDisconnect.addListener(() => this.port = null);
            }
        });
    }

    init() {
        chrome.runtime.onConnect.addListener(port => {
            if (port.name === this.port_name) {
                let binding = {
                    "port": port,
                    "events": []
                };
                this.bindings.push(binding);
                port.onMessage.addListener((message: any) => {
                    if (message.name === "subscribe") {
                        console.log("subscribe on " + message.eventName);
                        binding.events.push(message.eventName);
                        if (message.eventName in this.subscriptions_counter) {
                            this.subscriptions_counter[message.eventName] ++;
                        }
                        else {
                            this.subscriptions_counter[message.eventName] = 1;
                        }
                    }
                    else if (message.name === "unsubscribe") {
                        console.log("unsubscribe from: " + message.eventName);
                        let i = binding.events.indexOf(message.eventName);
                        if (i > -1) {
                            binding.events.splice(i, 1);
                            this.removeSubscriptions([message.eventName]);
                        }
                        else {
                            console.error("sunscription doesn't exist");
                        }
                    }
                });
                port.onDisconnect.addListener(() => {
                    console.log("on disconnect for: ", binding);
                    let i = this.bindings.indexOf(binding);
                    if (i > -1) {
                        this.removeSubscriptions(binding.events);
                        this.bindings.splice(i, 1);
                        binding = null;
                    }
                    else {
                        console.error("unable to find binding");
                    }
                });
            }
        });
    }

    registerObservable(o: Observable<{}>): void {
        o.subscribe(
            (next: any) => {
                console.log("next event: ", next, this.bindings);
                this.bindings.filter(x => x.events.includes(next.name)).forEach(b => b.port.postMessage(next));
            },
            (error) => {
                console.error("error occured in observer: ", error);
            },
            () => {
                console.log("close observable");
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
                    chrome.runtime.onConnect.addListener(port => {
                        if (port.name === this.port_name) {
                            this.AddMessageListener(port, name, handler);
                        }
                    });
                    return;
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
            console.log("port isn't connected");
            return;
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

    private AddMessageListener(port, name, handler) {
        port.onMessage.addListener((message: any) => {
            if (message.name === name) {
                console.log("got message on port: ", message);
                handler(message);
            }
        });
    }

    private removeSubscriptions(subscriptions: string[]) {
        console.log("removing subscriptions: ", subscriptions, this.subscriptions_counter);
        for (let s of subscriptions) {
            this.subscriptions_counter[s] --;
            if (this.subscriptions_counter[s] === 0) {
                this.onUnsubscribe.next({ name: s });
            }
        }
    }
}