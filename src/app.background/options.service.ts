import { Injectable } from "@angular/core";
import { BehaviorSubject  } from "rxjs/BehaviorSubject";

@Injectable()
export class OptionsService {
    language: BehaviorSubject <string>;
    setOnline: BehaviorSubject <boolean>;
    showRoundButtons: BehaviorSubject <boolean>;
    windowSize: BehaviorSubject<WindowSize>;
    activatePreviewFeatures: BehaviorSubject<boolean>;

    private defaultSettings: Settings = new Settings();

    private currentSettings: Settings;

    private windowSizes: { [size: string] : WindowSize } = {
        "small": { w: 300, h: 400 },
        "medium": { w: 400, h: 500 },
        "large": { w: 600, h: 600 },
        "extraLarge": { w: 800, h: 600 }
    };

    constructor() {
        let settings = JSON.parse(window.localStorage.getItem("settings")) as Settings;
        this.currentSettings = settings || this.defaultSettings;
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
        this.showRoundButtons = new BehaviorSubject(settings.showRoundButtons);
        this.windowSize = new BehaviorSubject(this.windowSizes[settings.windowSize]);
        this.activatePreviewFeatures = new BehaviorSubject(settings.activatePreviewFeatures);
    }

    private updateSettings(settings: Settings): void {
        console.log("update settings:", settings);
        if (settings.currentLang !== this.currentSettings.currentLang) {
            this.language.next(settings.currentLang);
        }
        if (settings.setOnline !== this.currentSettings.setOnline) {
            this.setOnline.next(settings.setOnline);
        }
        if (settings.showRoundButtons !== this.currentSettings.showRoundButtons) {
            this.showRoundButtons.next(settings.showRoundButtons);
        }
        if (settings.activatePreviewFeatures !== this.currentSettings.activatePreviewFeatures) {
            this.activatePreviewFeatures.next(settings.activatePreviewFeatures);
        }
        this.windowSize.next(this.windowSizes[settings.windowSize]);
    }
}

class Settings {
    currentLang: string = "ru";
    setOnline: boolean = false;
    showRoundButtons: boolean = false;
    windowSize: string = "medium";
    activatePreviewFeatures: boolean = false;
}

export class WindowSize {
    w: number;
    h: number;
}