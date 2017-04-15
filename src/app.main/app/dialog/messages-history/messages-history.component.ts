// tslint:disable-next-line:max-line-length
import { Component, Input, Output, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs/Rx';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

import { MessageViewModel, SingleMessageInfo, UserInfo, HistoryInfo, OneDayMessagesGroup, OneSenderMessagesGroup } from '../../datamodels';
import { DialogService, VKService, ChromeAPIService, OptionsService } from '../../services';
import { AppState } from '../../app.store';

@Component({
    selector: 'app-messages-history',
    templateUrl: 'messages-history.component.html',
    styleUrls: ['messages-history.component.scss']
})
export class MessagesHistoryComponent implements OnInit, OnDestroy {
    @Input() isChat: boolean;
    @Input() selectedPeerId: number;
    @Input() markAsRead: Observable<boolean>;

    participants: { [userId: number]: UserInfo } = {};
    userId: number;
    history: SingleMessageInfo[] = [];
    messagesCount: number = -1;
    subscriptions: Subscription[] = [];
    historyToShow: OneDayMessagesGroup[] = [];
    shownMessagesCount = 20;
    showOldHistoryLoadingSpinner = false;

    constructor (
        private store: Store<AppState>,
        private messagesService: DialogService,
        private vkservice: VKService,
        private router: Router,
        private changeDetector: ChangeDetectorRef,
        private chromeapi: ChromeAPIService,
        private settings: OptionsService,
        private renderer: Renderer) { }

    ngOnInit() {
        console.log('messages list component init');
        this.userId = this.vkservice.getCurrentUserId();

        this.subscriptions.push(
            Observable.combineLatest(
                this.store.select(s => s.history).map(h => h.history[this.selectedPeerId]).filter(x => Boolean(x)),
                this.store.select(s => s.users).map(u => u.users)
            ).subscribe(([history, users]) => {
                console.log('CONVERSATION');
                this.history = history.messages;
                this.messagesCount = history.count;
                this.participants = users;
                this.convertModel();
                console.log('force update');
                this.refreshView();
            })
        );
        this.subscriptions.push(this.markAsRead.subscribe(value => this.onMarkAsRead(value)));
    }

    ngOnDestroy() {
        console.log('messages list component destroy');
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }
    }

    convertModel() {
        if (this.history.length >= this.shownMessagesCount - 5) {
            this.showOldHistoryLoadingSpinner = false;
        }
        if (Math.abs(this.history.length - this.shownMessagesCount) < 5) {
            this.shownMessagesCount = this.history.length;
        }
        this.historyToShow = this.splitHistoryIntoGroups(this.history.slice(0, this.shownMessagesCount).reverse());
    }

    refreshView() {
        this.changeDetector.detectChanges();
    }

    private splitHistoryIntoGroups(messages: SingleMessageInfo[]): OneDayMessagesGroup[] {
        console.log('convert history: ', messages);
        if (!messages.length || !this.participants[messages[0].userId]) {
            console.log(
                'not enough data: ', this.participants,
                'messages count', messages.length,
                'first sender', messages.length ? this.participants[messages[0].userId] : undefined);
            return [];
        }

        messages.forEach(m => {
            m.clear = !!m.action;
            m.attachments = this.getMessageAttachments(m);
        });
        const history = this.groupByDateAndSender(messages);
        return history;
    }

    private groupByDateAndSender(messages: SingleMessageInfo[]): OneDayMessagesGroup[] {
        return _.chain(messages)
            .groupBy(x => Math.trunc(x.date / 86400))
            .toPairs()
            .map(pair => {
                const [date, messagesGroup] = pair as [string, SingleMessageInfo[]];
                return {
                    date: +date * 86400000,
                    messages: this.groupBySender(messagesGroup),
                    groupId: +`${messagesGroup[0].id}${messagesGroup.length}`
                } as OneDayMessagesGroup;
            })
            .value();
    }

    private groupBySender(messages: SingleMessageInfo[]): OneSenderMessagesGroup[] {
        return _(messages)
            .reduce((acc: SingleMessageInfo[][], value: SingleMessageInfo) => {
                if (acc.length && _.head(_.last(acc)).fromId === value.fromId) {
                    _.last(acc).push(value);
                } else {
                    acc.push([value]);
                }
                return acc;
            }, [])
            .map(x => {
                const head = (_.head(x) || {}) as SingleMessageInfo;
                return {
                    fromId: head.fromId,
                    date: head.date,
                    messages: x,
                    groupId: +`${head.id}${x.length}`
                } as OneSenderMessagesGroup;
            });
    }

    private getMessageAttachments(message: SingleMessageInfo) {
        const attachments = [];
        if (message.attachments) {
            for (const attachment of message.attachments) {
                if (attachment.photo || attachment.doc ||
                        attachment.wall || attachment.link ||
                        attachment.video || attachment.sticker ||
                        attachment.audio || attachment.geo) {
                    attachments.push(attachment);
                } else if (!attachment.fwd) {
                    attachments.push('[' + attachment.type + ']');
                }
                if (attachment.sticker) {
                    message.clear = true;
                }
            }
        }
        if (message.fwdMessages) {
            const attachment: any = {};
            attachment.type = 'fwd';
            attachment.fwd = this.convertFwdMessages(message.fwdMessages);
            attachments.push(attachment);
        }
        return attachments;
    }

    private convertFwdMessages(messages: SingleMessageInfo[]): OneDayMessagesGroup[] {
        /** body, date, user_id, attachments */
        if (!messages || messages.length === 0) {
            return [];
        }
        messages.forEach(m => m.attachments = this.getMessageAttachments(m));
        const result = this.groupByDateAndSender(messages);
        return result;
    }

    onMarkAsRead(value: boolean): void {
        if (!value) {
            return;
        }
        const ids = [];
        for (const m of this.history) {
            if (m.out || m.isRead) {
                break;
            }
            ids.push(m.id);
        }
        if (ids.length === 0) {
            console.log('unread messages was not found');
            return;
        }
        this.messagesService.markAsRead(ids.join()).subscribe(result => {
            if (result) {
                console.log('marked as read', ids);
                this.changeDetector.detectChanges();
            } else {
                console.log('failed to mark messages as read', ids);
            }
        });
    }

    loadOldMessages(): void {
        this.shownMessagesCount += 20;
        if (this.history.length >= this.shownMessagesCount) {
            this.convertModel();
        } else {
            this.showOldHistoryLoadingSpinner = true;
            this.messagesService.loadOldMessages(this.selectedPeerId);
        }
    }
}
