import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/fromEventPattern";
import "rxjs/add/observable/bindCallback";

@Injectable()
export class ChromeAPIDumbService {
    subscribeOnMessage(on: string): Observable<any> {
        return Observable.create(observer => {});
    }

    OnMessage(name: string): Observable<any> {
        return Observable.create(observer => {});
    }

    SendRequest(message): Observable<any> {
        return Observable.create(observer => {});
    }

    SendMessage(message): void {
        if (message.name === "open_separate_window") {
            chrome.windows.create({
                type: "panel",
                focused: true,
                state: "docked",
                width: 300,
                height: 400,
                url: "index.html"
            }, (window) => {
                console.dir(window);
                window.alwaysOnTop = true;
            });
        }
    }

    OnPortMessage(name): Observable<any> {
        return Observable.create(observer => {});
    }

    PostPortMessage(message): void {
    }

    isCurrentWindowMinimized(): Observable<boolean> {
        return Observable.of(false);
    }
}