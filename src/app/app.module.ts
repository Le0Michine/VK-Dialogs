import { NgModule, Inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { BrowserModule, Title } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { StoreModule, INITIAL_STATE, Store } from "@ngrx/store";
import { RouterStoreModule, replace } from "@ngrx/router-store";

import { TranslateModule } from "./translate";

import { AppComponent }  from "./app.component";
import { DialogListComponent }  from "./dialogs-list";
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
}  from "./dialog";

import { LoginComponent }  from "./login";
import { EmojiComponent }  from "./emoji";
import { PopupMenuComponent }  from "./popup-menu";
import { BreadcrumbComponent }  from "./breadcrumbs";
import { SearchComponent }  from "./search";
import { routes } from "./app.routing";

import { DialogService } from "./services";
import { VKService } from "./services";
import { ChromeAPIService } from "./services";
import { OptionsService } from "./services";
import { FileUploadService } from "./services";
import { StoreSyncService } from "./services";
import { StateResolverService } from "./services";
import { PIPES } from "./pipes";
import { AuthorizationGuard } from "./guards";
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
        ChromeAPIService,
        OptionsService,
        FileUploadService,
        AuthorizationGuard,
        StateResolverService,
        StoreSyncService,
        {
            provide: INITIAL_STATE,
            useFactory: stateFactory
        }
    ]
})
export class AppModule {
    constructor(
        store: Store<AppState>,
        stateResolver: StateResolverService
    ) {
        stateResolver.getState().subscribe((state: AppState) => {
            if (state) {
                store.dispatch({ type: "SET_NEW_STATE", payload: state });
                let path = decodeURI(state.router.path);
                store.dispatch(replace(path));
            }
        });
        store.subscribe(s => stateResolver.saveState(s));
    }
}