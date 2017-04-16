import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject } from 'rxjs/Rx';

import { WindowSize, Settings } from '../../../app.shared/datamodels';

@Injectable()
export class OptionsService {
    language: BehaviorSubject <string>;
    setOnline: BehaviorSubject <boolean>;
    showTyping: BehaviorSubject <boolean>;
    windowSize: BehaviorSubject<WindowSize>;
    activatePreviewFeatures: BehaviorSubject<boolean>;
    stickerSize: BehaviorSubject<number>;
    autoReadMessages: BehaviorSubject<boolean>;
    showNotifications: BehaviorSubject<boolean>;
    playSoundNotifications: BehaviorSubject<boolean>;
    notificationSound: BehaviorSubject<string>;

    private defaultSettings: Settings = new Settings();

    private currentSettings: Settings;

    private windowSizes: { [size: string]: WindowSize } = {
        'small': { w: 300, h: 400, size: 's' },
        'medium': { w: 400, h: 500, size: 'm' },
        'large': { w: 600, h: 600, size: 'l' },
        'extraLarge': { w: 800, h: 600, size: 'xl' }
    };

    private stickerSizes = {
        'small': 64,
        'medium': 128,
        'large': 256,
        'extraLarge': 512
    };

    constructor() {
        const storedSettings = JSON.parse(window.localStorage.getItem('settings')) as Settings;
        this.currentSettings = storedSettings || this.defaultSettings;
        this.initSubjects(this.currentSettings);

        chrome.storage.sync.get({ 'settings': this.defaultSettings }, (item: any) => {
            const settings = item.settings as Settings;
            this.updateSettings(settings);
            window.localStorage.setItem('settings', JSON.stringify(settings));
            this.currentSettings = settings;
        });

        chrome.storage.onChanged.addListener((changes, namespace) => {
            if ('settings' in changes) {
                const change = changes['settings'];
                console.log('detect settings changing', change.oldValue, change.newValue);
                this.updateSettings(change.newValue);
                this.currentSettings = change.newValue;
            }
        });
    }

    private initSubjects(settings: Settings) {
        console.log('init settings', settings);
        this.language = new BehaviorSubject(settings.currentLang);
        this.setOnline = new BehaviorSubject(settings.setOnline);
        this.showTyping = new BehaviorSubject(settings.showTyping);
        this.windowSize = new BehaviorSubject(this.windowSizes[settings.windowSize]);
        this.activatePreviewFeatures = new BehaviorSubject(settings.activatePreviewFeatures);
        this.stickerSize = new BehaviorSubject(this.stickerSizes[settings.stickerSize]);
        this.autoReadMessages = new BehaviorSubject(settings.autoReadMessages);
        this.showNotifications = new BehaviorSubject(settings.showNotifications);
        this.playSoundNotifications = new BehaviorSubject(settings.playSoundNotifications);
        this.notificationSound = new BehaviorSubject(settings.notificationSound);
    }

    private updateSettings(settings: Settings): void {
        console.log('update settings:', settings);
        if (settings.currentLang !== this.currentSettings.currentLang) {
            this.language.next(settings.currentLang);
        }
        if (settings.setOnline !== this.currentSettings.setOnline) {
            this.setOnline.next(settings.setOnline);
        }
        if (settings.showTyping !== this.currentSettings.showTyping) {
            this.showTyping.next(settings.showTyping);
        }
        if (settings.activatePreviewFeatures !== this.currentSettings.activatePreviewFeatures) {
            this.activatePreviewFeatures.next(settings.activatePreviewFeatures);
        }
        if (settings.showNotifications !== this.currentSettings.showNotifications) {
            this.showNotifications.next(settings.showNotifications);
        }
        if (settings.playSoundNotifications !== this.currentSettings.playSoundNotifications) {
            this.playSoundNotifications.next(settings.playSoundNotifications);
        }
        if (settings.notificationSound !== this.currentSettings.notificationSound) {
            this.notificationSound.next(settings.notificationSound);
        }
        this.windowSize.next(this.windowSizes[settings.windowSize]);
        this.stickerSize.next(this.stickerSizes[settings.stickerSize]);
        this.autoReadMessages.next(settings.autoReadMessages);
    }
}
