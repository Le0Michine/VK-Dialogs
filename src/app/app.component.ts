import { Component, ChangeDetectorRef, Renderer, ViewChild, ElementRef, AfterViewInit, OnInit } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Location } from "@angular/common";
import { Store } from "@ngrx/Store";
import { TranslateService } from "ng2-translate/ng2-translate";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import "rxjs/add/Observable/interval";
import "rxjs/add/operator/first";

import { ChromeAPIService } from "./services";
import { OptionsService } from "./services";
import { DialogService } from "./services";
import { MenuItem } from "./datamodels";
import { DialogShortInfo } from "./datamodels";
import { AppStore } from "./app.store";

const slideAnimationLength = 200;
const rotateAnimationLength = 200;

@Component({
    selector: "my-app",
    templateUrl: "app.component.html",
    styleUrls: [
        "css/font-style.css",
        "css/round-buttons.css",
        "css/color-scheme.css",
        "app.component.css"
    ]
})
export class AppComponent implements AfterViewInit, OnInit {
    @ViewChild("main") mainDiv: ElementRef;
    showSearchBar: boolean = false;
    searchFocus: Subject<boolean> = new Subject();
    title: string = "";
    unreadCount: number = 6;
    isPopupMenuOpened: boolean = false;

    windowWidth: string = "300px";
    windowHeight: string = "400px";

    popupMenuItems: MenuItem[] = [
        {name: "settings", id: 1, termId: "menuItems.settings"},
        {name: "openInVk", id: 2, termId: "menuItems.openInVk"},
        {name: "openInWindow", id: 3, termId: "menuItems.openInWindow"},
        {name: "logOff", id: 4, termId: "menuItems.logOff"}
    ];

    foundDialogs: DialogShortInfo[] = [];

    constructor(
        private store: Store<AppStore>,
        private translate: TranslateService,
        private location: Location,
        private router: Router,
        private ref: ChangeDetectorRef,
        private chromeapi: ChromeAPIService,
        private dialogs: DialogService,
        private settings: OptionsService,
        private renderer: Renderer
    ) {
        translate.setDefaultLang("en");
    }

    ngAfterViewInit() {
        this.renderer.invokeElementMethod(this.mainDiv.nativeElement, "focus");
    }

    ngOnInit() {
        console.log("app component init");
        this.translate.use("ru");
        this.settings.language.subscribe(lang => {
            console.log("current lang", lang);
            this.translate.use(lang);
        });
        this.settings.windowSize.subscribe(size => {
            this.windowWidth = size.w + "px";
            this.windowHeight = size.h + "px";
        });
        this.router.events.subscribe((event) => {
            this.routeChanged();
        });
        this.chromeapi.OnPortMessage("unread_count").map(x => x.data as number).subscribe(n => {
            this.unreadCount = n;
        });

        this.settings.activatePreviewFeatures.subscribe(v => this.showSearchBar = v);
    }

    onDialogSelect(dialog: DialogShortInfo) {
        this.router.navigate(["dialogs", dialog.type === "profile" ? "dialog" : "chat", dialog.id, dialog.title]);
    }

    private search(searchTerm: string) {
        if (!searchTerm) {
            this.foundDialogs = [];
            return;
        }
        this.dialogs.searchDialog(searchTerm).subscribe(result => {
            console.log("got search result", result);
            this.foundDialogs = result;
            this.ref.detectChanges();
        });
    }

    private openMenu(event: MouseEvent) {
        event.stopPropagation();
        this.isPopupMenuOpened = !this.isPopupMenuOpened;
    }

    private routeChanged(): void {
        let path: string[] = this.location.path().split("/");
        if (path.length < 2 || path[1] !== "dialog") {
            if (path[1] === "authorize") {
                this.windowHeight = "150px";
            }
        }
        this.ref.detectChanges();
    }

    private logOff() {
        this.chromeapi.SendMessage({name: "logoff"});
        this.router.navigate(["authorize"]);
    }

    private goToConversation() {
        this.store.select(s => s.history).first().subscribe(h => {
            chrome.tabs.create({
                url: `https://vk.com/im?sel=${h.isChat ? "c" : ""}${h.conversationId}`,
                selected: true
            });
        });
    }

    private openSettings() {
        chrome.extension.getURL("/app.options/options.html");
        chrome.tabs.create({
            url: chrome.extension.getURL("/app.options/options.html"),
            selected: true
        });
    }

    private openSeparateWindow() {
        this.settings.windowSize.subscribe(size => {
            this.chromeapi.SendMessage({name: "open_separate_window", w: size.w, h: size.h});
        });
    }

    private onMenuItemSelect(item: number): void {
        console.log("menu item selected", item);
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
                console.error("wrong menu item");
        }
    }

    private closePopupMenu() {
        if (this.isPopupMenuOpened) {
            this.isPopupMenuOpened = false;
        }
    }

    private keyDown(event: KeyboardEvent) {
        if (event.ctrlKey && event.keyCode === 70) {// ctrl + f
            event.preventDefault();
            event.stopPropagation();
            this.searchFocus.next(true);
        }
    }
}