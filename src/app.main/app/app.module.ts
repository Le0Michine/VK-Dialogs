import { NgModule, Inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { BrowserModule, Title } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { StoreModule, INITIAL_STATE, Store } from '@ngrx/store';
import { RouterStoreModule, replace } from '@ngrx/router-store';

import { TranslateModule } from '../../app.shared/translate/translate.module';

import { AppComponent } from './app.component';
import { DialogListComponent } from './dialogs-list/dialog-list.component';
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
} from './dialog';

import { LoginComponent } from './login/login.component';
import { EmojiComponent } from './emoji/emoji.component';
import { PopupMenuComponent } from './popup-menu/popup-menu.component';
import { BreadcrumbComponent } from './breadcrumbs/breadcrumb.component';
import { SearchComponent } from './search/search.component';
import { routes } from './app.routing';

import { DialogService } from './services/dialog.service';
import { VKService } from './services/vk.service';
import { ChromeAPIService } from './services/chrome-api.service';
import { OptionsService } from './services';
import { FileUploadService } from './services';
import { StoreSyncService } from './services';
import { StateResolverService } from './services';
import { PIPES } from './pipes';
import { AuthorizationGuard } from './guards';
import { rootReducer, AppState, stateFactory } from './app.store';
import { DialogListFilterComponent } from './dialog-list-filter/dialog-list-filter.component';

@NgModule({
    imports: [
        HttpModule,
        BrowserModule,
        FormsModule,
        RouterModule.forRoot(routes, { useHash: true }),
        TranslateModule.forRoot(),
        StoreModule.provideStore(rootReducer),
        RouterStoreModule.connectRouter(),
        BrowserAnimationsModule
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
        DialogListFilterComponent,
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
                store.dispatch({ type: 'SET_NEW_STATE', payload: state });
                const path = decodeURI(state.router.path);
                store.dispatch(replace(path));
            }
        });
        store.subscribe(s => stateResolver.saveState(s));
    }
}
