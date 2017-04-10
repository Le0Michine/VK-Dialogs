import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class NotificationService {
    sendChromeNotification(id: string, text, title, subtitle, userPhoto) {
        const notification: any = {
            'type': 'basic',
            'notificationId': id,
            'iconUrl': userPhoto,
            'title': title,
            'message': text,
            'contextMessage': subtitle,
            'priority': 0,
            'eventTime': Date.now() + 5000,
            'isClickable': false,
            'requireInteraction': false
        };
        console.dir(notification);
        chrome.notifications.create(id, notification);
    }
}
