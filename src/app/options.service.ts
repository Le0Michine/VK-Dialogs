import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";

@Injectable()
export class OptionsService {
    language: Subject<string> = new Subject();
    setOnline: Subject<boolean> = new Subject();
    showRoundButtons: Subject<boolean> = new Subject();

    constructor() {
        chrome.storage.sync.get({ "settings": { "currentLang": "ru", "setOnline": true } }, (item: any) => {
            let settings = item.settings;
            console.log("got settings:", settings);
            this.language.next(settings.currentLang);
            this.setOnline.next(settings.setOnline);
            this.showRoundButtons.next(settings.showRoundButtons);
        })
    }
}

class Settings {
    currentLang: string;
    setOnline: boolean;
    showRoundButtons: boolean;
}