import { NgModule }      from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { StoreModule } from "@ngrx/Store";

import { BackgroundComponent }  from "./background.component";
import { VKService } from "./services";
import { UserService } from "./services";
import { CacheService } from "./services";
import { DialogService } from "./services";
import { LPSService } from "./services";
import { ChromeAPIService } from "./services";
import { FileUploadService } from "./services";
import { OptionsService } from "./services";

import { appBackgroundStore } from "./app-background.store";

@NgModule({
    imports:      [ BrowserModule, HttpModule, StoreModule.provideStore(appBackgroundStore) ],
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