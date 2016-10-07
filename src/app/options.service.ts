import { Injectable } from "@angular/core";
import { BehaviorSubject  } from "rxjs/BehaviorSubject";

@Injectable()
export class OptionsService {
    language: BehaviorSubject <string>;
    setOnline: BehaviorSubject <boolean>;
    showRoundButtons: BehaviorSubject <boolean>;
    windowSize: BehaviorSubject<string[]>;

    private defaultSettings: Settings = new Settings();

    private currentSettings: Settings;

    private windowSizes: { [size: string] : string[] } = {
        "small": [ "300px", "400px" ],
        "medium": [ "400px", "500px" ],
        "large": [ "600px", "600px" ],
        "extraLarge": [ "800px", "600px" ]
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
        })
    }

    private initSubjects(settings: Settings) {
        console.log("init settings", settings);
        this.language = new BehaviorSubject(settings.currentLang);
        this.setOnline = new BehaviorSubject(settings.setOnline);
        this.showRoundButtons = new BehaviorSubject(settings.showRoundButtons);
        this.windowSize = new BehaviorSubject(this.windowSizes[settings.windowSize]);
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
        this.windowSize.next(this.windowSizes[settings.windowSize]);
    }
}

class Settings {
    currentLang: string = "ru";
    setOnline: boolean = false;
    showRoundButtons: boolean = false;
    windowSize: string = "medium";
}