///<reference path="../typings/globals/chrome/index.d.ts"/>
import { Component, ChangeDetectorRef, trigger, state, transition, style, animate, keyframes } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Observable } from "rxjs/Observable";
import "rxjs/add/Observable/interval";
import { Location } from '@angular/common';
import { TranslateService } from "ng2-translate/ng2-translate";
import { ChromeAPIService } from "./chrome-api-service";
import { OptionsService } from "./options.service";

const slideAnimationLength = 200;
const rotateAnimationLength = 200;

@Component({
    selector: "my-app",
    templateUrl: "app.component.html",
    styleUrls: [
        "app.component.css", "css/round-buttons.css"
    ],
    animations: [
        trigger('flyInOut', [
            state('in', style({transform: 'translateX(0)', opacity: 1})),
            state('out_r', style({transform: 'translateX(100%)', opacity: 0, display: 'none'})),
            transition('out_r => in', [
                animate(slideAnimationLength, keyframes([
                    style({opacity: 0, transform: 'translateX(100%)', offset: 0}),
                    style({opacity: 1, transform: 'translateX(-15px)',  offset: 0.3}),
                    style({opacity: 1, transform: 'translateX(0)',     offset: 1.0})
                ]))
            ]),
            transition('in => out_r', [
                animate(slideAnimationLength, style({transform: 'translateX(100%)', opacity: 0}))
            ])
        ]),
        trigger('rotateLeftRight', [
            state('right', style({transform: 'rotate(0deg)'})),
            state('left', style({transform: 'rotate(90deg)'})),
            transition('right => left', [
                style({transform: 'rotate(0deg)'}),
                animate(rotateAnimationLength)
            ]),
            transition('left => right', [
                animate(rotateAnimationLength, style({transform: 'rotate(0deg)'}))
            ])
        ])
    ]
})
export class AppComponent {
    mainTitle: string = "";
    title: string = "";
    conversationId: number;
    isChat: boolean;
    backIsAvailable: boolean = false;
    isPopupMenuOpened: boolean = false;
    showRoundButtons: boolean = false;

    windowWidth: string = "300px";
    windowHeight: string = "400px";

    popupMenuItems: string[] = [
        "settings",
        "openInVk",
        "openInWindow",
        "logOff"
    ];

    showActions: string = "out_r";
    rotateSettings: string = "right";

    stopWatch = Observable.interval(1000);

    constructor(
            private translate: TranslateService,
            private location: Location,
            private router: Router,
            private ref: ChangeDetectorRef,
            private chromeapi: ChromeAPIService,
            private settings: OptionsService) {
        translate.setDefaultLang("en");
        translate.use("ru"); /** need to be initialized without delay caused by chrome.storage.sync.get */

        settings.language.subscribe(lang => {
            console.log("current lang", lang);
            translate.use(lang);
            this.translate.get("dialogs").subscribe(value => {
                this.mainTitle = value; 
                this.routeChanged();
                ref.detectChanges();
            });
        });
        settings.showRoundButtons.subscribe(show => {
            this.showRoundButtons = show;
            ref.detectChanges();
        });
        settings.windowSize.subscribe(size => {
            this.windowWidth = size[0];
            this.windowHeight = size[1];
        });

        chrome.storage.onChanged.addListener(function(changes, namespace) {
            if ("currentLang" in changes) {
                let change = changes["currentLang"];
                console.log(`detect language changing from ${change.oldValue} to ${change.newValue}`);
                translate.use(change.newValue);
            }
        });
        router.events.subscribe((event) => {
            this.routeChanged();
        });
    }

    ngOnInit() {
        console.log("app component init");
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
        this.chromeapi.SendMessage({name: "open_separate_window"});
    }

    private onMenuItemSelect(item: string): void {
        console.log("menu item selected", item);
        this.isPopupMenuOpened = false;
        switch (item) {
            case "settings":
                this.openSettings();
                break;
            case "openInVk":
                this.goToConversation();
                break;
            case "openInWindow":
                this.openSeparateWindow();
                break;
            case "logOff":
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