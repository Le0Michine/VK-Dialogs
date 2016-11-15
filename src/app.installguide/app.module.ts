import { NgModule, ChangeDetectorRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule, DomSanitizer } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { TranslateModule } from "../app/translate";
import { ru } from "../app/translate/_ru";
import { en } from "../app/translate/_en";

import { InstallComponent }  from "./install.component";
import { ChromeAPIService } from "../app/services";

@NgModule({
    imports: [
        BrowserModule,
        TranslateModule.forRoot()
    ],
    declarations: [
        InstallComponent
    ],
    bootstrap: [
        InstallComponent
    ],
    providers: [
        ChromeAPIService
    ]
})
export class AppInstallModule { }