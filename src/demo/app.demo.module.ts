import { NgModule, Inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { BrowserModule, Title } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { StoreModule, INITIAL_STATE, Store } from "@ngrx/store";
import { RouterStoreModule, replace } from "@ngrx/router-store";

import { TranslateModule } from "../app/translate";

import { AppComponent }  from "../app/app.component";
import { DialogListComponent }  from "../app/dialogs-list";
import {
    DialogComponent,
    MessageInputComponent,
    MessagesHistoryComponent,
    MessagesListComponent,
    UserAvatarComponent,
    MessageTitleComponent,
    MessageBodyComponent,
    AttachmentComponent,
    AttachmentPhotoComponent,
    AttachmentDocComponent,
    AttachmentStickerComponent,
    ForwardedMessagesComponent
}  from "../app/dialog";

import { LoginComponent }  from "../app/login";
import { EmojiComponent }  from "../app/emoji";
import { PopupMenuComponent }  from "../app/popup-menu";
import { BreadcrumbComponent }  from "../app/breadcrumbs";
import { SearchComponent }  from "../app/search";
import { routes } from "../app/app.routing";

import { DialogService } from "../app/services";
import { VKService } from "../app/services";
import { OptionsService } from "../app/services";
import { ChromeAPIService } from "../app/services";
import { FileUploadService } from "../app/services";
import { StoreSyncService } from "../app/services";
import { StateResolverService } from "../app/services";
import { StoreSyncDumbService } from "./store-sync.dumb-service";
import { PIPES } from "../app/pipes";
import { AuthorizationGuard } from "../app/guards";
import { ChromeAPIDumbService } from "./chrome-api.dumb-service";
import { rootReducer, AppState, stateFactory } from "./app.store";

@NgModule({
    imports: [
        HttpModule,
        BrowserModule,
        FormsModule,
        RouterModule.forRoot(routes, { useHash: true }),
        TranslateModule.forRoot(),
        StoreModule.provideStore(rootReducer),
        RouterStoreModule.connectRouter()
    ],
    declarations: [
        AppComponent,
        DialogComponent,
        DialogListComponent,
        MessageInputComponent,
        MessagesListComponent,
        MessagesHistoryComponent,
        LoginComponent,
        EmojiComponent,
        PopupMenuComponent,
        SearchComponent,
        BreadcrumbComponent,
        AttachmentComponent,
        AttachmentPhotoComponent,
        AttachmentDocComponent,
        AttachmentStickerComponent,
        ForwardedMessagesComponent,
        UserAvatarComponent,
        MessageTitleComponent,
        MessageBodyComponent,
        ...PIPES
    ],
    bootstrap: [
        AppComponent
    ],
    providers: [
        Title,
        VKService,
        DialogService,
        OptionsService,
        FileUploadService,
        AuthorizationGuard,
        StateResolverService,
        { provide: ChromeAPIService, useClass: ChromeAPIDumbService },
        { provide: StoreSyncService, useClass: StoreSyncDumbService },
        {
            provide: INITIAL_STATE,
            useFactory: stateFactory
        }
    ]
})
export class AppModule { }