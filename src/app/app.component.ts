///<reference path="../typings/globals/chrome/index.d.ts"/>
import { Component, ChangeDetectorRef, trigger, state, transition, style, animate } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Observable } from "rxjs/Observable";
import "rxjs/add/Observable/interval";
import { Location } from '@angular/common';
import { TranslateService } from "ng2-translate/ng2-translate";

const slideAnimationLength = 400;
const rotateAnimationLength = 400;

@Component({
    selector: "my-app",
    templateUrl: "app.component.html",
    styleUrls: [
        "app.component.css", "css/round-buttons.css"
    ],
    animations: [
        trigger('flyInOut', [
            state('in', style({transform: 'translateX(0)'})),
            state('out_r', style({transform: 'translateX(500%)', display: "none"})),
            transition('out_r => in', [
                style({transform: 'translateX(500%)'}),
                animate(slideAnimationLength)
            ]),
            transition('in => out_r', [
                animate(slideAnimationLength, style({transform: 'translateX(500%)'}))
            ])
        ]),
        trigger('rotateLeftRight', [
            state('right', style({transform: 'rotate(0deg)'})),
            state('left', style({transform: 'rotate(180deg)'})),
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
    backIsAvailable: boolean = false;

    showActions: string = "out_r";
    rotateSettings: string = "right";

    stopWatch = Observable.interval(1000);

    constructor(private translate: TranslateService, private location: Location, private router: Router, private ref: ChangeDetectorRef) {
        translate.setDefaultLang("en");
        translate.use("ru"); /** need to be initialized without delay caused by chrome.storage.sync.get */
        chrome.storage.sync.get({ "currentLang": "ru" }, (items) => {
            console.log("got settings: ", items);
            translate.use(items["currentLang"]);
            this.mainTitle = this.translate.instant("dialogs");
            this.routeChanged();
            ref.detectChanges();
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
    }

    showButtons() {
        this.showActions = "in";
        this.rotateSettings = "left";
    }

    hideButtons() {
        this.showActions = "out_r";
        this.rotateSettings = "right";
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
}