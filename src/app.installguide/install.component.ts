///<reference path="../typings/globals/chrome/index.d.ts"/>
import { Component } from "@angular/core";
import { TranslateService } from "ng2-translate/ng2-translate";
import { ChromeAPIService } from "../app/chrome-api-service";

@Component({
    selector: "install",
    templateUrl: "install.component.html",
    styleUrls: ["install.component.css"]
})
export class InstallComponent {
    progress: number = 20;

    constructor(translate: TranslateService, private chromeapi: ChromeAPIService) {
        setTimeout(() => this.progress = 80, 1000);

        translate.setDefaultLang("en");
        translate.use("ru"); /** need to be initialized without delay caused by chrome.storage.sync.get */
        chrome.storage.sync.get({ "currentLang": "ru" }, (items) => {
            console.log("got settings: ", items);
            translate.use(items["currentLang"]);
        });
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            if ("currentLang" in changes) {
                let change = changes["currentLang"];
                console.log(`detect language changing from ${change.oldValue} to ${change.newValue}`);
                translate.use(change.newValue);
            }
        });
    }

    ngOnInit() {
        this.chromeapi.init();
    }

    authorize() {
        this.chromeapi.PostPortMessage({ name: "authorize" });
    }
}