/// <reference path="../typings/globals/chrome/index.d.ts"/>

import { Injectable } from "@angular/core";
import { Http, Response, RequestOptionsArgs, RequestOptions } from "@angular/http";
import { Observable }     from "rxjs/Observable";
import "rxjs/add/operator/timeout";
import "rxjs/add/operator/map";

@Injectable()
export class NotificationService {
    sendChromeNotification(id: string, text, title, subtitle, user_photo) {
        let notification: any = {
            "type": "basic",
            "notificationId": id,
            "iconUrl": user_photo,
            "title": title,
            "message": text,
            "contextMessage": subtitle,
            "priority": 0,
            "eventTime": Date.now() + 5000,
            "isClickable": false,
            "requireInteraction": false
        };
        console.dir(notification);
        chrome.notifications.create(id, notification);
    }
}