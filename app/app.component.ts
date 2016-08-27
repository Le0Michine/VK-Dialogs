/// <reference path="../typings/globals/chrome/index.d.ts"/>
import { Component } from "@angular/core";
import { TranslateService } from "ng2-translate/ng2-translate";

@Component({
    selector: "my-app",
    templateUrl: "app/app.component.html",
})
export class AppComponent {
    title = "Dialogs";

    constructor(translate: TranslateService) {
        translate.setDefaultLang("ru");
        translate.use("ru");
    }
}