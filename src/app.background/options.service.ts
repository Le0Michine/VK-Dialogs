import { Injectable } from "@angular/core";
import { BehaviorSubject  } from "rxjs/BehaviorSubject";

@Injectable()
export class OptionsService {
    language: BehaviorSubject <string>;
    setOnline: BehaviorSubject <boolean>;
    windowSize: BehaviorSubject<WindowSize>;
    activatePreviewFeatures: BehaviorSubject<boolean>;
    stickerSize: BehaviorSubject<number>;
    autoReadMessages: BehaviorSubject<boolean>;

    private defaultSettings: Settings = new Settings();

    private currentSettings: Settings;

    private windowSizes: { [size: string]: WindowSize } = {
        "small": { w: 300, h: 400, size: "s" },
        "medium": { w: 400, h: 500, size: "m" },
        "large": { w: 600, h: 600, size: "l" },
        "extraLarge": { w: 800, h: 600, size: "xl" }
    };

    private stickerSizes = {
        "small": 64,
        "medium": 128,
        "large": 256,
        "extraLarge": 512
    };

    constructor() {
        let storedSettings = JSON.parse(window.localStorage.getItem("settings")) as Settings;
        this.currentSettings = storedSettings || this.defaultSettings;
        this.initSubjects(this.currentSettings);

        chrome.storage.sync.get({ "settings": this.defaultSettings }, (item: any) => {
            let settings = item.settings as Settings;
            this.updateSettings(settings);
            window.localStorage.setItem("settings", JSON.stringify(settings));
            this.currentSettings = settings;
        });

        chrome.storage.onChanged.addListener((changes, namespace) => {
            if ("settings" in changes) {
                let change = changes["settings"];
                console.log("detect settings changing", change.oldValue, change.newValue);
                this.updateSettings(change.newValue);
                this.currentSettings = change.newValue;
            }
        });
    }

    private initSubjects(settings: Settings) {
        console.log("init settings", settings);
        this.language = new BehaviorSubject(settings.currentLang);
        this.setOnline = new BehaviorSubject(settings.setOnline);
        this.windowSize = new BehaviorSubject(this.windowSizes[settings.windowSize]);
        this.activatePreviewFeatures = new BehaviorSubject(settings.activatePreviewFeatures);
        this.stickerSize = new BehaviorSubject(this.stickerSizes[settings.stickerSize]);
        this.autoReadMessages = new BehaviorSubject(settings.autoReadMessages);
    }

    private updateSettings(settings: Settings): void {
        console.log("update settings:", settings);
        if (settings.currentLang !== this.currentSettings.currentLang) {
            this.language.next(settings.currentLang);
        }
        if (settings.setOnline !== this.currentSettings.setOnline) {
            this.setOnline.next(settings.setOnline);
        }
        if (settings.activatePreviewFeatures !== this.currentSettings.activatePreviewFeatures) {
            this.activatePreviewFeatures.next(settings.activatePreviewFeatures);
        }
        this.windowSize.next(this.windowSizes[settings.windowSize]);
        this.stickerSize.next(this.stickerSizes[settings.stickerSize]);
        this.autoReadMessages.next(settings.autoReadMessages);
    }
}

class Settings {
    currentLang: string = "ru";
    setOnline: boolean = false;
    windowSize: string = "medium";
    activatePreviewFeatures: boolean = false;
    stickerSize: string = "large";
    autoReadMessages: boolean = true;
}

export class WindowSize {
    size: string;
    w: number;
    h: number;
}