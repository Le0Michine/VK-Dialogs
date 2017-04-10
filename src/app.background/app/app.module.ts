import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { StoreModule, INITIAL_STATE } from '@ngrx/store';

import { BackgroundComponent } from './background.component';
import { VKService, UserService, DialogService, LPSService, ChromeAPIService, FileUploadService, OptionsService } from './services';
import { appBackgroundState, appStateFactory, rootReducer } from './app-background.store';

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        StoreModule.provideStore(rootReducer)
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
