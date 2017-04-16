import { NgModule, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpModule } from '@angular/http';
import { TranslateModule } from '../../app.shared/translate';
import { ru } from '../../app.shared/translate/_ru';
import { en } from '../../app.shared/translate/_en';

import { InstallComponent } from './install.component';
import { ChromeAPIService } from '../../app.main/app/services';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
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
