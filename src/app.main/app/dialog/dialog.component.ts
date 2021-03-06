// tslint:disable-next-line:max-line-length
import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, EventEmitter, AfterViewInit } from '@angular/core';
import { trigger, state, transition, style, animate, keyframes } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { go } from '@ngrx/router-store';
import { Observable, Subscription } from 'rxjs/Rx';

import { DialogService, VKService, ChromeAPIService, FileUploadService, OptionsService, StoreSyncService } from '../services';
import { SingleMessageInfo, HistoryInfo } from '../datamodels';
import { closeSelectedConversation, updateBreadcrumbs } from '../actions';
import { MenuItem } from '../datamodels';
import { BreadcrumbActions, SelectedConversationActions } from '../reducers';
import { AppState } from '../app.store';

@Component({
    selector: 'app-messages',
    templateUrl: 'dialog.component.html',
    styleUrls: [
        'dialog.component.scss',
    ],
    animations: [
        trigger('flyInOut', [
            state('in', style({transform: 'translateX(0) scale(1)'})),
            state('out', style({transform: 'translateX(0) scale(0)', opacity: 0, display: 'none'})),
            transition('out => in', [
                animate(200, keyframes([
                    style({opacity: 0, transform: 'translateX(0) scale(0)', offset: 0}),
                    style({opacity: 1, transform: 'translateX(0) scale(1.1)', offset: 0.3}),
                    style({opacity: 1, transform: 'translateX(0) scale(1)', offset: 1.0})
                ]))
            ]),
            transition('in => out', [
                animate(100, style({transform: 'translateX(0) scale(0)'}))
            ]),
            transition('void => *', [
                animate(0, style({transform: 'translateX(0) scale(0)', opacity: 0, display: 'none'}))
            ])
        ])
    ]
})
export class DialogComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('conversationsWrapper') messagesList: ElementRef;

    title = 'Dialog';
    isChat: boolean;
    selectedPeerId: number;
    attachmentsUploadingCount = 0;
    attachments: MenuItem[] = [];

    attachmentUploaded: EventEmitter<boolean> = new EventEmitter();
    selectEmoji: EventEmitter<string> = new EventEmitter();
    onEmojiToggle: EventEmitter<boolean> = new EventEmitter();
    markAsRead: EventEmitter<boolean> = new EventEmitter();
    onSendMessageClick: EventEmitter<{}> = new EventEmitter();
    newAttachment: EventEmitter<MenuItem> = new EventEmitter();
    removeAttachment: EventEmitter<string> = new EventEmitter();
    onInput: Observable<string> = new Observable();

    unreadMessages = 'out';
    autoReadMessages = true;
    scrollToBottomAvailable = 'out';
    sendEnabled = true;
    isAttachedFilesOpened = false;
    attachedFiles: any[];

    topPanel = 'calc(100% - 130px - 45px)';
    bottomPanel = 'calc(100% - 130px)';
    emojiPanel = '130px';
    loadEmoji = false;

    scrollPosition = 1000000;
    scrollHeight = 1000000;
    autoScrollToBottom = true;

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
        private store: Store<AppState>,
        private storeSync: StoreSyncService
    ) { }

    ngOnInit() {
        console.log('specific dialog component init');

        this.route.params.subscribe(params => {
            this.title = decodeURI(params['title']);
            this.selectedPeerId = +params['id'];
            const type = params['type'];
            this.isChat = type === 'dialog' ? false : true;

            this.subscriptions.push(this.store.select(s => s.selectedConversation).subscribe(x => {
                this.store.dispatch(updateBreadcrumbs([{ title: x.title, navigationLink: 'dialogs', backArrow: true }]));
                this.pageTitle.setTitle(x.title);
                this.title = x.title;
            }));

            this.chromeapi.SendMessage({
                name: 'last_opened',
                last_opened: {
                    id: this.selectedPeerId,
                    title: this.title,
                    type: this.isChat ? 'chat' : 'dialog'
                }
            });

            this.subscriptions.push(this.storeSync.subscribeOnHistory(this.selectedPeerId, this.isChat));

            this.subscriptions.push(this.store.select(s => s.history)
                .map(h => h.history[this.selectedPeerId])
                .filter(x => Boolean(x))
                .subscribe(data => {
                    console.log('HISTORY', data);
                    if (!this.autoReadMessages) {
                        this.unreadMessages = (data.messages.findIndex(m => !m.isRead && !m.out) > -1) ? 'in' : 'out';
                    }
                    if (this.autoScrollToBottom) {
                        setTimeout(() => this.scrollToBottom(), 0);
                    } else {
                        this.scrollHeight += 1000000;
                    }

                    this.subscriptions.push(this.chromeapi.isCurrentWindowMinimized().subscribe(minimized => {
                        if (!minimized && this.autoReadMessages) {
                            this.onMarkAsRead();
                        } else if (minimized && this.autoReadMessages) {
                            Observable.merge(
                                Observable
                                    .interval(1000)
                                    .concatMap(() => this.chromeapi.isCurrentWindowMinimized())
                                    .filter(isMin => !isMin)
                                    .map(() => true),
                                this.store.select(s => s.history)
                                    .map(h => h.history[this.selectedPeerId])
                                    .filter(x => Boolean(x))
                                    .take(2)
                                    .last()
                                    .map(() => false)
                                ).first()
                                .subscribe(x => {
                                    if (x) {
                                        this.onMarkAsRead();
                                    }
                                });
                        }
                    }));
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
                if (value.size === 's') {
                    this.topPanel = 'calc(100% - 95px - 45px)';
                    this.bottomPanel = 'calc(100% - 95px)';
                    this.emojiPanel = '95px';
                }
            })
        );

        this.subscriptions.push(
            this.store.select(s => s.inputMessages)
                .filter(x => x.conversationIds.indexOf(this.selectedPeerId) > -1)
                .map(x => x.messages[this.selectedPeerId].attachments)
                .subscribe(att => {
                    this.attachments = att;
                    this.changeDetector.detectChanges();
                })
        );
    }

    ngAfterViewInit() {
        console.log('after view init');
        this.scrollToBottom();
        setTimeout(() => { this.loadEmoji = true; }, 200);
    }

    scrollToBottom(): void {
        this.autoScrollToBottom = true;
        this.scroll(this.scrollHeight);
        setTimeout(() => this.scrollToBottomAvailable = 'out', 100);
    }

    scroll(height: number): void {
        this.renderer.setElementProperty(this.messagesList.nativeElement, 'scrollTop', height);
    }

    messageSent(value: boolean): void {
        this.sendEnabled = value;
    }

    startResize(divs: HTMLDivElement[], event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        for (const div of divs) {
            div.onmousemove = e => this.resize(e);
        }
    }

    stopResize(divs: HTMLDivElement[], event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        for (const div of divs) {
            div.onmousemove = undefined;
        }
    }

    resize(e: MouseEvent) {
        e.preventDefault();
        const y = Math.max(150, e.pageY);
        this.topPanel = `${y - 65}px`;
        this.bottomPanel = `${y - 20}px`;
        this.emojiPanel = `calc(100% - ${y - 20}px)`;
        if (this.autoScrollToBottom) {
            this.scrollToBottom();
        }
    }

    ngOnDestroy() {
        console.log('specific dialog component destroy');
        for (const s of this.subscriptions) {
            s.unsubscribe();
        }
        this.store.dispatch(closeSelectedConversation());
        this.store.dispatch(go(['dialogs']));
    }

    onMarkAsRead() {
        this.markAsRead.emit(true);
        this.unreadMessages = 'out';
        this.changeDetector.detectChanges();
    }

    onScroll(current: number, max: number) {
        this.scrollPosition = current;
        this.scrollHeight = max;
        this.autoScrollToBottom = max - current < 400;
        this.scrollToBottomAvailable = max - current < 400 ? 'out' : 'in';
        this.changeDetector.detectChanges();
    }

    onEmojiSelect(event): void {
        this.selectEmoji.emit(event);
    }

    errorHandler(error) {
        console.error('An error occurred', error);
    }

    toggleEmoji() {
        this.loadEmoji = true;
        this.onEmojiToggle.emit(true);
    }

    uploadFiles(event): void {
        if (!event.target.files.length) {
            console.log('nothing to upload');
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
        const fileName = file.name;
        this.fileUpload.uploadFile(file).subscribe(att => {
            console.log('attachment is ready to send', att);
            this.attachmentsUploadingCount--;
            if (!this.attachmentsUploadingCount) {
                this.attachmentUploaded.emit(true);
            }
            this.newAttachment.emit({ name: fileName, id: att, termId: '' });
            this.changeDetector.detectChanges();
        });
    }

    onAttachedFileRemove(fileId: string): void {
        console.log('removing', fileId);
        this.removeAttachment.emit(fileId);
    }

    showAttachments(): void {
        this.isAttachedFilesOpened = this.attachments.length > 0;
    }

    hideAttachments(): void {
        this.isAttachedFilesOpened = false;
    }
}
