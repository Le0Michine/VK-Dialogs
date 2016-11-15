import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, EventEmitter } from "@angular/core";
import { trigger, state, transition, style, animate, keyframes } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { Store } from "@ngrx/store";
import { go } from "@ngrx/router-store";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import "rxjs/add/operator/debounceTime";
import "rxjs/add/operator/distinctUntilChanged";

import { DialogService, VKService, ChromeAPIService, FileUploadService, OptionsService, StoreSyncService } from "../services";
import { SingleMessageInfo, HistoryInfo } from "../datamodels";
import { MenuItem } from "../datamodels";
import { BreadcrumbActions, CurrentConversationIdActions } from "../reducers";
import { AppStore } from "../app.store";

@Component({
    selector: "messages",
    templateUrl: "dialog.component.html",
    styleUrls: [
        "../css/round-buttons.css",
        "../css/color-scheme.css",
        "../app.component.css",
        "dialog.component.css",
    ],
    animations: [
        trigger("flyInOut", [
            state("in", style({transform: "translateX(0) scale(1)"})),
            state("out", style({transform: "translateX(0) scale(0)", opacity: 0, display: "none"})),
            transition("out => in", [
                animate(200, keyframes([
                    style({opacity: 0, transform: "translateX(0) scale(0)", offset: 0}),
                    style({opacity: 1, transform: "translateX(0) scale(1.1)", offset: 0.3}),
                    style({opacity: 1, transform: "translateX(0) scale(1)", offset: 1.0})
                ]))
            ]),
            transition("in => out", [
                animate(100, style({transform: "translateX(0) scale(0)"}))
            ]),
            transition("void => *", [
                animate(0, style({transform: "translateX(0) scale(0)", opacity: 0, display: "none"}))
            ])
        ])
    ]
})
export class DialogComponent implements OnInit, OnDestroy {
    @ViewChild("conversationsWrapper") messagesList: ElementRef;

    title = "Dialog";
    isChat: boolean;
    conversationId: number;
    attachmentsUploadingCount: number = 0;
    attachments: MenuItem[] = [];

    attachmentUploaded: EventEmitter<boolean> = new EventEmitter();
    selectEmoji: EventEmitter<string> = new EventEmitter();
    onEmojiToggle: EventEmitter<boolean> = new EventEmitter();
    markAsRead: EventEmitter<boolean> = new EventEmitter();
    onSendMessageClick: EventEmitter<{}> = new EventEmitter();
    newAttachment: EventEmitter<MenuItem> = new EventEmitter();
    removeAttachment: EventEmitter<string> = new EventEmitter();
    onInput: Observable<string> = new Observable();

    unreadMessages: string = "out";
    autoReadMessages: boolean = true;
    scrollToBottomAvailable: string = "out";
    sendEnabled: boolean = true;
    isAttachedFilesOpened: boolean = false;
    attachedFiles: any[];

    topPanel: string = "calc(100% - 130px - 45px)";
    bottomPanel: string = "calc(100% - 130px)";
    emojiPanel: string = "130px";
    loadEmoji: boolean = false;

    scrollPosition: number = 1000000;
    scrollHeight: number = 1000000;
    autoScrollToBottom: boolean = true;

    subscriptions: Subscription[] = [];

    constructor (
        private messagesService: DialogService,
        private vkservice: VKService,
        private pageTitle: Title,
        private route: ActivatedRoute,
        private changeDetector: ChangeDetectorRef,
        private chromeapi: ChromeAPIService,
        private fileUpload: FileUploadService,
        private renderer: Renderer,
        private settings: OptionsService,
        private store: Store<AppStore>,
        private storeSync: StoreSyncService
    ) { }

    ngOnInit() {
        console.log("specific dialog component init");

        this.route.params.subscribe(params => {
            this.title = decodeURI(params["title"]);
            this.conversationId = +params["id"];
            let type = params["type"];
            this.isChat = type === "dialog" ? false : true;

            this.store.dispatch({ type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: [{ title: this.title, navigationLink: "dialogs", leftArrow: true }] });
            this.pageTitle.setTitle(this.title);

            this.chromeapi.SendMessage({
                name: "last_opened",
                last_opened: {
                    id: this.conversationId,
                    title: this.title,
                    type: this.isChat ? "chat" : "dialog"
                }
            });

            this.subscriptions.push(this.storeSync.subscribeOnHistory(this.conversationId, this.isChat));

            this.subscriptions.push(this.store.select(s => s.history)
                .map(h => h.history[this.conversationId])
                .filter(x => x ? true : false)
                .subscribe(data => {
                    console.log("HISTORY", data);
                    let historyInfo = new HistoryInfo();
                    historyInfo.messages = data.messages;
                    historyInfo.count = data.count;
                    if (!this.autoReadMessages) {
                        this.unreadMessages = (historyInfo.messages.findIndex(m => !m.isRead && !m.out) > -1) ? "in" : "out";
                        this.changeDetector.detectChanges();
                    }
                    else {
                        this.chromeapi.isCurrentWindowMinimized().subscribe(minimized => {
                            if (!minimized) {
                                this.onMarkAsRead();
                            }
                        });
                    }
                    if (this.autoScrollToBottom) {
                        setTimeout(() => this.scrollToBottom(), 0);
                    }
                    else {
                        this.scrollHeight += 1000000;
                    }
                })
            );

            // this.onInput.debounceTime(3000).distinctUntilChanged().subscribe(() => this.vkservice.setActive());
        });

        this.subscriptions.push(
            this.settings.autoReadMessages.subscribe(value => {
                this.autoReadMessages = value;
            })
        );

        this.subscriptions.push(
            this.settings.windowSize.subscribe(value => {
                if (value.size === "s") {
                    this.topPanel = "calc(100% - 95px - 45px)";
                    this.bottomPanel = "calc(100% - 95px)";
                    this.emojiPanel = "95px";
                }
            })
        );
    }

    ngAfterViewInit() {
        console.log("after view init");
        this.scrollToBottom();
        setTimeout(() => { this.loadEmoji = true; }, 200);
    }

    scrollToBottom(): void {
        this.autoScrollToBottom = true;
        this.scroll(this.scrollHeight);
        setTimeout(() => this.scrollToBottomAvailable = "out", 100);
    }

    scroll(height: number): void {
        this.renderer.setElementProperty(this.messagesList.nativeElement, "scrollTop", height);
    }

    messageSent(value: boolean): void {
        this.sendEnabled = value;
    }

    startResize(divs: HTMLDivElement[], event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        for (let div of divs) {
            div.onmousemove = e => this.resize(e);
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
        let y = Math.max(150, e.pageY);
        this.topPanel = `${y - 65}px`;
        this.bottomPanel = `${y - 20}px`;
        this.emojiPanel = `calc(100% - ${y - 20}px)`;
        if (this.autoScrollToBottom) {
            this.scrollToBottom();
        }
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
        this.store.dispatch({ type: CurrentConversationIdActions.UPDATED, payload: null });
        this.store.dispatch(go(["dialogs"]));
    }

    onMarkAsRead() {
        this.markAsRead.emit(true);
        this.unreadMessages = "out";
        this.changeDetector.detectChanges();
    }

    onScroll(current: number, max: number) {
        this.scrollPosition = current;
        this.scrollHeight = max;
        this.autoScrollToBottom = max - current < 400;
        this.scrollToBottomAvailable = max - current < 400 ? "out" : "in";
    }

    onEmojiSelect(event): void {
        this.selectEmoji.emit(event);
    }

    errorHandler(error) {
        console.error("An error occurred", error);
    }

    toggleEmoji() {
        this.loadEmoji = true;
        this.onEmojiToggle.emit(true);
    }

    uploadFiles(event): void {
        if (!event.target.files.length) {
            console.log("nothing to upload");
            return;
        }
        this.attachmentUploaded.emit(false);
        this.changeDetector.detectChanges();
        for (let i = 0; i < event.target.files.length; i++) {
            this.uploadFile(event.target.files.item(i));
        }
    }

    uploadFile(file: File) {
        this.attachmentsUploadingCount++;
        let fileName = file.name;
        this.fileUpload.uploadFile(file).subscribe(att => {
            console.log("attachment is ready to send", att);
            this.attachmentsUploadingCount--;
            if (!this.attachmentsUploadingCount) {
                this.attachmentUploaded.emit(true);
            }
            this.newAttachment.emit({ name: fileName, id: att, termId: "" });
            this.changeDetector.detectChanges();
        });
    }

    onAttachmentsUpdate(attachments: MenuItem[]): void {
        console.log("update attachments", this.attachments, attachments);
        this.attachments = attachments;
        this.changeDetector.detectChanges();
    }

    onAttachedFileRemove(fileId: string): void {
        console.log("removing", fileId);
        this.removeAttachment.emit(fileId);
    }

    showAttachments(): void {
        this.isAttachedFilesOpened = this.attachments.length > 0;
    }

    hideAttachments(): void {
        this.isAttachedFilesOpened = false;
    }

    uploadFilesFromClipboard(event: ClipboardEvent) {
        // TODO: improve or remove
        return;
        /* let files: File[] = [];
        if (event.clipboardData.files.length) {
            for (let i = 0; i < event.clipboardData.files.length; i++) {
                this.uploadFile(event.clipboardData.files.item(i));
            }
        }
        else {
            for(let i = 0; i < event.clipboardData.items.length; i++) {
                let item = event.clipboardData.items[i];
                console.log("clipboard item", item.kind, item.type);
                if (item.kind === "file" && item.type.startsWith("image")) {
                    this.uploadFile(item.getAsFile());
                }
            }
        }*/
    }
}