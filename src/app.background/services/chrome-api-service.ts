import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/observable/fromEventPattern";
import "rxjs/add/observable/bindCallback";

@Injectable()
export class ChromeAPIService {
    onUnsubscribe = new Subject();
    onSubscribe = new Subject();

    private portName: string = "message_port";
    private port: chrome.runtime.Port = null;

    private subscriptionsCounter = {};
    private bindings = [];
    private observables = [];

    /**
     * starts listen for chrome.runtime.onConnect.
     */
    AcceptConnections() {
        chrome.runtime.onConnect.addListener(port => {
            if (port.name === this.portName) {
                console.log("connect to port: ", port);
                this.port = port;
                port.onDisconnect.addListener(() => this.port = null);
            }
        });
    }

    init() {
        chrome.runtime.onConnect.addListener(port => {
            if (port.name === this.portName) {
                let binding = {
                    "port": port,
                    "events": []
                };
                this.bindings.push(binding);
                port.onMessage.addListener((message: any) => {
                    if (message.name === "subscribe") {
                        console.log("subscribe on " + message.eventName);
                        this.onSubscribe.next(message.eventName);
                        binding.events.push(message.eventName);
                        this.observables.forEach(o => o.first().subscribe(m => {
                            if (m.name === message.eventName) {
                                binding.port.postMessage(m);
                            }
                        }));
                        if (message.eventName in this.subscriptionsCounter) {
                            this.subscriptionsCounter[message.eventName] ++;
                        }
                        else {
                            this.subscriptionsCounter[message.eventName] = 1;
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
                console.log("next event:", next, "bindings:", this.bindings);
                this.bindings.filter(x => x.events.includes(next.name)).forEach(b => b.port.postMessage(next));
            },
            (error) => {
                console.error("error occured in observer: ", error);
            },
            () => {
                console.log("close observable");
            }
        );
        this.observables.push(o);
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
                }
                return false;
            }),
            (handler: (o: Object) => void) => chrome.runtime.onMessage.removeListener(handler)
        );
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
            (handler: (o: Object) => void) => {
                if (!this.port) {
                    chrome.runtime.onConnect.addListener(port => {
                        if (port.name === this.portName) {
                            this.AddMessageListener(port, name, handler);
                        }
                    });
                    return;
                }
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
     * adds onDisconnect listener to existing port.
     */
    OnDisconnect(): Observable<{}> {
        if (!this.port) {
            return Observable.bindCallback(
                (callback: () => void) => chrome.runtime.onConnect.addListener(port => {
                    if (port.name === this.portName) {
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
        console.log("removing subscriptions: ", subscriptions, this.subscriptionsCounter);
        for (let s of subscriptions) {
            this.subscriptionsCounter[s] --;
            if (this.subscriptionsCounter[s] === 0) {
                this.onUnsubscribe.next({ name: s });
            }
        }
    }
}