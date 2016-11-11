import { NgModule, Inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { BrowserModule, Title } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { TranslateModule } from "ng2-translate/ng2-translate";
import { StoreModule, INITIAL_STATE, Store } from "@ngrx/store";
import { RouterStoreModule } from "@ngrx/router-store";

import { AppComponent }  from "./app.component";
import { DialogListComponent }  from "./dialogs-list";
import { DialogComponent, MessageInputComponent, MessagesListComponent }  from "./dialog";
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
import { appStore, INITIAL_APP_STATE, AppStore } from "./app.store";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        RouterModule.forRoot(routes, { useHash: true }),
        TranslateModule.forRoot(),
        StoreModule.provideStore(appStore),
        RouterStoreModule.connectRouter()
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
        StateResolverService,
        StoreSyncService,
        {
            provide: INITIAL_STATE,
            useValue: JSON.parse(localStorage.getItem("savedState")) || INITIAL_APP_STATE
        }
    ]
})
export class AppModule {
    constructor(
        store: Store<AppStore>,
        @Inject(INITIAL_STATE) initState: AppStore,
        stateResolver: StateResolverService
    ) {
        store.subscribe(s => stateResolver.saveState(s));
    }
}