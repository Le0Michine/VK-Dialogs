///<reference path="../typings/globals/chrome/index.d.ts"/>
import { Component, ChangeDetectorRef } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Observable } from "rxjs/Observable";
import "rxjs/add/Observable/interval";
import { Location } from '@angular/common';
import { TranslateService } from "ng2-translate/ng2-translate";
import { ChromeAPIService } from "./chrome-api-service";
import { OptionsService } from "./services";
import { MenuItem } from "./menu-item";

const slideAnimationLength = 200;
const rotateAnimationLength = 200;

@Component({
    selector: "my-app",
    templateUrl: "app.component.html",
    styleUrls: [
        "app.component.css",
        "css/round-buttons.css",
        "css/color-scheme.css",
        "css/font-style.css"
    ]
})
export class AppComponent {
    mainTitle: string = "";
    title: string = "";
    conversationId: number;
    isChat: boolean;
    backIsAvailable: boolean = false;
    isPopupMenuOpened: boolean = false;

    windowWidth: string = "300px";
    windowHeight: string = "400px";

    popupMenuItems: MenuItem[] = [
        {name: "settings", id: 1, termId: "menuItems.settings"},
        {name: "openInVk", id: 2, termId: "menuItems.openInVk"},
        {name: "openInWindow", id: 3, termId: "menuItems.openInWindow"},
        {name: "logOff", id: 4, termId: "menuItems.logOff"}
    ];

    showActions: string = "out_r";
    rotateSettings: string = "right";

    constructor(
            private translate: TranslateService,
            private location: Location,
            private router: Router,
            private ref: ChangeDetectorRef,
            private chromeapi: ChromeAPIService,
            private settings: OptionsService) {
        translate.setDefaultLang("en");
    }

    ngOnInit() {
        console.log("app component init");
        this.translate.use("ru");
        this.settings.language.subscribe(lang => {
            console.log("current lang", lang);
            this.translate.use(lang);
            this.translate.get("dialogs").subscribe(value => {
                this.mainTitle = value; 
                this.routeChanged();
            });
        });
        this.settings.windowSize.subscribe(size => {
            this.windowWidth = size.w + "px";
            this.windowHeight = size.h + "px";
        });
        this.router.events.subscribe((event) => {
            this.routeChanged();
        });
    }

    showButtons() {
        this.showActions = "in";
        this.rotateSettings = "left";
    }

    hideButtons() {
        this.showActions = "out_r";
        this.rotateSettings = "right";
    }

    private openMenu(event: MouseEvent) {
        event.stopPropagation();
        this.isPopupMenuOpened = !this.isPopupMenuOpened;
    }

    private goBack() {
        this.location.back();
        this.backIsAvailable = false;
    }

    private routeChanged(): void {
        let path: string[] = this.location.path().split("/");
        if (path.length < 2 || path[1] !== "dialog") {
            this.backIsAvailable = false;
            if (path[1] === "authorize") {
                this.translate.get("authorize_btn").subscribe(value => this.mainTitle = value);
                this.windowHeight = "150px";
            }
        }
        else {
            this.conversationId = Number(path[2]);
            this.isChat = path[3] === "chat"
            try {
                let urlTree = this.router.parseUrl(path[path.length - 1]);
                this.title = urlTree.root.children["primary"].segments[0].path;
                this.backIsAvailable = true;
            }
            catch (e) {
                console.dir(e);
            }
        }
        this.ref.detectChanges();
    }

    private logOff() {
        this.chromeapi.SendMessage({name: "logoff"});
        this.router.navigate(["authorize"]);
    }

    private goToConversation() {
        chrome.tabs.create({
            url: `https://vk.com/im?sel=${this.isChat ? "c" : ""}${this.conversationId}`,
            selected: true
        });
    }

    private openSettings() {
        chrome.extension.getURL("/app.options/options.html")
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
}