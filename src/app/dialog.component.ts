import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, EventEmitter } from "@angular/core";
import { trigger, state, transition, style, animate } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import { DialogService } from "./dialogs-service";
import { UserService } from "./user-service";
import { VKService } from "./vk-service";
import { Channels } from "../app.background/channels";
import { ChromeAPIService } from "./chrome-api-service";
import { DateConverter } from "./date-converter";
import { SingleMessageInfo, HistoryInfo } from "./datamodels/datamodels";

@Component({
    selector: "messages",
    templateUrl: "dialog.component.html",
    styleUrls: [
        "dialog.component.css", "app.component.css", "css/round-buttons.css"
    ],
    animations: [
        trigger('flyInOut', [
            state('in', style({transform: 'translateX(0)'})),
            state('out', style({transform: 'translateX(500%)', display: "none"})),
            transition('out => in', [
                style({transform: 'translateX(500%)'}),
                animate(100)
            ]),
            transition('in => out', [
                animate(100, style({transform: 'translateX(500%)'}))
            ])
        ])
    ]
})
export class DialogComponent implements OnInit, OnDestroy {
    @ViewChild("conversationsWrapper") messagesList: ElementRef;

    title = "Dialog";
    is_chat: boolean;
    conversation_id: number;

    selectEmoji: EventEmitter<string> = new EventEmitter();
    markAsRead: EventEmitter<boolean> = new EventEmitter();
    historyUpdate: EventEmitter<HistoryInfo> = new EventEmitter();
    onSendMessageClick: EventEmitter<{}> = new EventEmitter();

    unreadMessages: string = "out";
    scrollToBottomAvailable: string = "out";
    onMessageSent: EventEmitter<{}> = new EventEmitter();

    topPanel: string = "calc(100% - 200px)";
    bottomPanel: string = "calc(100% - 150px)";

    scrollPosition: number = 10000;
    scrollHeight: number = 10000;

    subscriptions: Subscription[] = []

    constructor (
        private messages_service: DialogService,
        private vkservice: VKService,
        private user_service: UserService,
        private router: Router,
        private route: ActivatedRoute,
        private change_detector: ChangeDetectorRef,
        private chromeapi: ChromeAPIService,
        private renderer: Renderer) { }

    ngOnInit() {
        console.log("specific dialog component init");
        //setTimeout(() => document.getElementById("conversationWrapper").scrollTop = 1000, 10000);
        this.route.params.subscribe(params => {
            this.title = params["title"];
            this.conversation_id = +params["id"];
            let type = params["type"];
            this.is_chat = type === "dialog" ? false : true;

            this.chromeapi.SendMessage({
                name: "last_opened",
                last_opened: {
                    id: this.conversation_id,
                    title: this.title,
                    type: this.is_chat ? "chat" : "dialog"
                }
            });

            this.subscriptions.push(this.messages_service.getHistory(this.conversation_id, this.is_chat).subscribe(data => {
                console.log("got history update", data);
                let historyInfo = new HistoryInfo();
                historyInfo.messages = data.history;
                historyInfo.count = data.count;
                this.historyUpdate.emit(historyInfo);
                this.unreadMessages = (historyInfo.messages.findIndex(m => !m.isRead && !m.out) > -1) ? "in" : "out";
                this.change_detector.detectChanges();
                this.scrollToBottom();
            }));
        });
    }

    ngAfterViewInit() {
        console.log("after view init");
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.messagesList && this.messagesList.nativeElement) {
            this.renderer.setElementProperty(this.messagesList.nativeElement, "scrollTop", this.scrollHeight);
            setTimeout(() => this.scrollToBottomAvailable = "out", 100);
        }
        else {
            console.warn("messagesList isn't initialized", this.messagesList);
        }
    }

    messageSent(value: boolean): void {
        this.onMessageSent.emit(value);
        this.change_detector.detectChanges();
    }

    startResize(divs: HTMLDivElement[], event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        for (let div of divs) {
            div.onmousemove = (event) => this.resize(event);
        }
    }

    stopResize(divs: HTMLDivElement[], event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        for (let div of divs) {
            div.onmousemove = undefined;
        }
    }

    resize(e: MouseEvent) {
        e.preventDefault();
        this.topPanel = `${e.pageY - 70}px`;
        this.bottomPanel = `${e.pageY - 20}px`;
    }

    ngOnDestroy() {
        console.log("specific dialog component destroy");
        this.chromeapi.SendMessage({
            name: "last_opened",
            last_opened: null,
            go_back: true
        });
        for (let s of this.subscriptions) {
            s.unsubscribe();
        }
    }

    onMarkAsRead() {
        this.markAsRead.emit(true);
        this.unreadMessages = "out";
        this.change_detector.detectChanges();
    }

    onScroll(current: number, max: number) {
        this.scrollPosition = current;
        this.scrollHeight = max;
        this.scrollToBottomAvailable = "in";
    }

    onEmojiSelect(event): void {
        console.info("on emoji select", event);
        this.selectEmoji.emit(event);
    }

    errorHandler(error) {
        console.error("An error occurred", error);
    }

    toggleEmoji() {
        let emoji_wrapper = document.getElementById("emoji_control") as HTMLDivElement;
        if (emoji_wrapper.clientHeight && emoji_wrapper.clientHeight > 20) {
            this.collapseEmoji(emoji_wrapper);
        }
        else {
            emoji_wrapper.style.height = "210px";
            emoji_wrapper.style.visibility = "visible";
            emoji_wrapper.style.display = "block";
            emoji_wrapper.onmouseenter = () => this.onEmojiMouseEnter();
        }
    }

    onEmojiMouseEnter() {
        console.log("onmouseenter");
        let emoji_wrapper = document.getElementById("emoji_control") as HTMLDivElement;
        emoji_wrapper.onmouseenter = null;
        setTimeout(() => emoji_wrapper.onmouseleave = () => this.collapseEmoji(emoji_wrapper), 300);
    }

    collapseEmoji(emoji_wrapper: HTMLDivElement) {
        emoji_wrapper.style.height = "0";
        emoji_wrapper.onmouseleave = null;
        setTimeout(() => {
            emoji_wrapper.style.visibility = "hidden";
            emoji_wrapper.style.display = "none";
        }, 300);
    }
}