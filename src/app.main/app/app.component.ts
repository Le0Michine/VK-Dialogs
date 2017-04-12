import { Component, ChangeDetectorRef, Renderer, ViewChild, ElementRef, AfterViewInit, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { go } from '@ngrx/router-store';
import { TranslateService } from '../../app.shared/translate';
import { Observable, Subject } from 'rxjs/Rx';

import { ChromeAPIService } from './services';
import { OptionsService } from './services';
import { DialogService } from './services';
import { StoreSyncService } from './services';
import { MenuItem } from './datamodels';
import { DialogShortInfo, DialogListFilterInfo } from './datamodels';
import { AppState } from './app.store';

const slideAnimationLength = 200;
const rotateAnimationLength = 200;

@Component({
    selector: 'app-vk-dialogs',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent implements AfterViewInit, OnInit {
    @ViewChild('main') mainDiv: ElementRef;
    title = '';
    unreadCount = 6;
    isPopupMenuOpened = false;

    windowWidth = '300px';
    windowHeight = '400px';

    private dialogListFilter: DialogListFilterInfo = {} as DialogListFilterInfo;
    private _popupMenuItems: MenuItem[] = [
        {name: 'settings', id: 1, termId: 'menuItems.settings'},
        {name: 'openInVk', id: 2, termId: 'menuItems.openInVk'},
        {name: 'openInWindow', id: 3, termId: 'menuItems.openInWindow'},
        {name: 'logOff', id: 4, termId: 'menuItems.logOff'}
    ];

    get popupMenuItems(): MenuItem[] {
        return [...this._popupMenuItems];
    }

    foundDialogs: DialogShortInfo[] = [];

    constructor(
        private ref: ChangeDetectorRef,
        private renderer: Renderer,
        private store: Store<AppState>,
        private translate: TranslateService,
        private chromeapi: ChromeAPIService,
        private dialogs: DialogService,
        private settings: OptionsService,
        private storeSync: StoreSyncService
    ) {
        translate.setDefaultLang('en');
        storeSync.init();
    }

    ngAfterViewInit() {
        this.renderer.invokeElementMethod(this.mainDiv.nativeElement, 'focus');
    }

    ngOnInit() {
        console.log('app component init');
        this.translate.use('ru');
        this.settings.language.subscribe(lang => {
            console.log('current lang', lang);
            this.translate.use(lang);
        });
        this.settings.windowSize.subscribe(size => {
            this.windowWidth = size.w + 'px';
            this.windowHeight = size.h + 'px';
            this.ref.detectChanges();
        });
        this.chromeapi.OnPortMessage('unread_count').map(x => x.data as number).subscribe(n => {
            this.unreadCount = n;
        });
        this.store.select(s => s.dialogsFilter).subscribe(f => this.dialogListFilter = f);
    }

    onDialogSelect(dialog: DialogShortInfo) {
        const link = ['dialogs', dialog.type === 'profile' ? 'dialog' : 'chat', dialog.id, dialog.title];
        this.store.dispatch(go(link));
    }

    search(searchTerm: string) {
        if (!searchTerm) {
            this.foundDialogs = [];
            return;
        }
        this.dialogs.searchDialog(searchTerm).subscribe(result => {
            console.log('got search result', result);
            this.foundDialogs = result;
            this.ref.detectChanges();
        });
    }

    openMenu(event: MouseEvent) {
        event.stopPropagation();
        this.isPopupMenuOpened = !this.isPopupMenuOpened;
    }

    logOff() {
        this.chromeapi.SendMessage({name: 'logoff'});
        this.store.dispatch(go(['authorize']));
    }

    goToConversation() {
        this.store.select(s => s.selectedConversation)
            .concatMap(selectedConversation => this.store.select(s => s.history)
            .map(x => x.history[selectedConversation.peerId]))
            .subscribe(h => {
                let url = 'https://vk.com/im';
                if (h) {
                    url += `?sel=${h.isChat ? 'c' : ''}${h.peerId}`;
                }
                chrome.tabs.create({
                    url: url,
                    selected: true
                });
            });
    }

    openSettings() {
        chrome.extension.getURL('/app.options/options.html');
        chrome.tabs.create({
            url: chrome.extension.getURL('/app.options/options.html'),
            selected: true
        });
    }

    openSeparateWindow() {
        this.settings.windowSize.subscribe(size => {
            this.chromeapi.SendMessage({name: 'open_separate_window', w: size.w, h: size.h});
        });
    }

    onMenuItemSelect(item: number): void {
        console.log('menu item selected', item);
        this.isPopupMenuOpened = false;
        switch (item) {
            case 1: // "settings"
                this.openSettings();
                break;
            case 2: // "openInVk"
                this.goToConversation();
                break;
            case 3: // "openInWindow"
                this.openSeparateWindow();
                break;
            case 4: // "logOff"
                this.logOff();
                break;
            default:
                console.error('wrong menu item');
        }
    }

    closePopupMenu() {
        if (this.isPopupMenuOpened) {
            this.isPopupMenuOpened = false;
        }
    }
}
