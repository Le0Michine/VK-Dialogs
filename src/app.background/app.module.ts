import { NgModule }      from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";

import { BackgroundComponent }  from "./background.component";
import { VKService } from "./vk-service";
import { UserService } from "./user-service";
import { CacheService } from "./cache-service";
import { DialogService } from "./dialogs-service";
import { LPSService } from "./lps-service";
import { ChromeAPIService } from "./chrome-api-service";
import { FileUploadService } from "./file-upload.service";
import { OptionsService } from "./options.service";

@NgModule({
    imports:      [ BrowserModule, HttpModule ],
    declarations: [ BackgroundComponent ],
    bootstrap:    [ BackgroundComponent ],
    providers: [
        VKService,
        DialogService,
        UserService,
        CacheService,
        LPSService,
        ChromeAPIService,
        FileUploadService,
        OptionsService
    ]
})
export class AppModule { }