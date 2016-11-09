import { NgModule }      from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { StoreModule, INITIAL_STATE } from "@ngrx/Store";

import { BackgroundComponent }  from "./background.component";
import { VKService } from "./services";
import { UserService } from "./services";
import { DialogService } from "./services";
import { LPSService } from "./services";
import { ChromeAPIService } from "./services";
import { FileUploadService } from "./services";
import { OptionsService } from "./services";

import { appBackgroundStore, INITIAL_APP_STATE } from "./app-background.store";

@NgModule({
    imports:      [
        BrowserModule,
        HttpModule,
        StoreModule.provideStore(appBackgroundStore)
    ],
    declarations: [ BackgroundComponent ],
    bootstrap:    [ BackgroundComponent ],
    providers: [
        VKService,
        DialogService,
        UserService,
        LPSService,
        ChromeAPIService,
        FileUploadService,
        OptionsService,
        {
            provide: INITIAL_STATE,
            useValue: INITIAL_APP_STATE
        }
    ]
})
export class AppModule { }