import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule, Title } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { TranslateModule } from "ng2-translate/ng2-translate";
import { StoreModule, INITIAL_STATE } from "@ngrx/Store";

import { AppComponent }  from "./app.component";
import { DialogListComponent }  from "./dialogs-list";
import { DialogComponent, MessageInputComponent, MessagesListComponent }  from "./dialog";
import { LoginComponent }  from "./login";
import { EmojiComponent }  from "./emoji";
import { PopupMenuComponent }  from "./popup-menu";
import { BreadcrumbComponent }  from "./breadcrumbs";
import { SearchComponent }  from "./search";
import { routing } from "./app.routing";

import { DialogService } from "./services";
import { VKService } from "./services";
import { ChromeAPIService } from "./services";
import { OptionsService } from "./services";
import { FileUploadService } from "./services";
import { StoreSyncService } from "./services";
import { PIPES } from "./pipes";
import { AuthorizationGuard } from "./guards";
import { appStore, INITIAL_APP_STATE } from "./app.store";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        routing,
        TranslateModule.forRoot(),
        StoreModule.provideStore(appStore)
    ],
    declarations: [
        AppComponent,
        DialogComponent,
        DialogListComponent,
        MessageInputComponent,
        MessagesListComponent,
        LoginComponent,
        EmojiComponent,
        PopupMenuComponent,
        SearchComponent,
        BreadcrumbComponent,
        ...PIPES
    ],
    bootstrap: [
        AppComponent
    ],
    providers: [
        Title,
        VKService,
        DialogService,
        ChromeAPIService,
        OptionsService,
        FileUploadService,
        AuthorizationGuard,
        StoreSyncService,
        {
            provide: INITIAL_STATE,
            useValue: INITIAL_APP_STATE
        }
    ]
})
export class AppModule { }