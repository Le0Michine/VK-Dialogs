import { Injectable } from '@angular/core';
import { Http, Response, RequestOptionsArgs, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Rx';

import { SingleMessageInfo, UserInfo } from '../../../app.shared/datamodels';
import { ChromeNotificationBuilder } from '../../../app.shared/utils';

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

    showNottfication(message: SingleMessageInfo, user: UserInfo, playSound: boolean, sound: string) {
        const notification = new ChromeNotificationBuilder()
            .addType('basic')
            .addIconUrl(message.photo50 || user.photo200)
            .addTitle(message.title || user.fullName)
            .addMessage(message.title ? user.fullName : '')
            .addContextMessage(message.body)
            .build();
        chrome.notifications.create(`${message.id}`, notification);

        if (playSound) {
            this.playNotificationSound(sound);
        }
    }

    playNotificationSound(fileName: string) {
        // const notificationSound = new Audio(chrome.extension.getURL('stuffed-and-dropped.mp3'));
        const notificationSound = new Audio(chrome.extension.getURL(`assets/sounds/${fileName}`));
        notificationSound.play();
    }
}
