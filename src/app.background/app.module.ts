import { NgModule }      from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { StoreModule, INITIAL_STATE } from "@ngrx/store";

import { BackgroundComponent }  from "./background.component";
import { VKService } from "./services";
import { UserService } from "./services";
import { DialogService } from "./services";
import { LPSService } from "./services";
import { ChromeAPIService } from "./services";
import { FileUploadService } from "./services";
import { OptionsService } from "./services";

import { appBackgroundState, appStateFactory } from "./app-background.store";

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        StoreModule.provideStore(appBackgroundState)
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
            useFactory: appStateFactory
        }
    ]
})
export class AppModule { }