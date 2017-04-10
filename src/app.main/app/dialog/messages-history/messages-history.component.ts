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
    messagesCount: number;
    subscriptions: Subscription[] = [];
    historyToShow: OneDayMessagesGroup[] = [];

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
                this.historyToShow = this.splitHistoryIntoGroups(this.history.concat([]).reverse());
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
        console.log('history: ', history);
        return history;
    }

    private groupByDateAndSender(messages: SingleMessageInfo[]): OneDayMessagesGroup[] {
        return _.chain(messages)
            .groupBy(x => Math.trunc(x.date / 86400))
            .toPairs()
            .map(pair => ({
                date: +pair[0] * 86400000,
                messages: this.groupBySender(pair[1] as SingleMessageInfo[])
            }))
            .value();
    }

    private groupBySender(messages: SingleMessageInfo[]): OneSenderMessagesGroup[] {
        return _.chain(messages)
            .groupBy(x => x.fromId)
            .toPairs()
            .map(pair => _.zipObject(['fromId', 'messages'], [+pair[0], pair[1]]) as OneSenderMessagesGroup)
            .value();
    }

    getMessageAttachments(message: SingleMessageInfo) {
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

    convertFwdMessages(messages: SingleMessageInfo[]): OneDayMessagesGroup[] {
        /** body, date, user_id, attachments */
        if (!messages || messages.length === 0) {
            return [];
        }
        console.info('converting fwd msgs', messages);
        messages.forEach(m => m.attachments = this.getMessageAttachments(m));
        const result = this.groupByDateAndSender(messages);

        // messages[0].attachments = this.getMessageAttachments(messages[0]);
        // let messageModel: MessageViewModel = {
        //     date: messages[0].date,
        //     from: this.participants[messages[0].userId] || new UserInfo(),
        //     fromId: messages[0].userId,
        //     messages: [messages[0]],
        //     isRead: true
        // };
        // for (let i = 1; i < messages.length; i++) {
        //     // messages[i].attachments = this.getMessageAttachments(messages[i]);
        //     if (messageModel.fromId === messages[i].userId) {
        //         messageModel.messages.push(messages[i]);
        //     } else {
        //         result.push(messageModel);
        //         messageModel = {
        //             date: messages[i].date,
        //             from: this.participants[messages[i].userId] || new UserInfo(),
        //             fromId: messages[0].userId,
        //             messages: [messages[i]],
        //             isRead: true
        //         };
        //     }
        // }
        // result.push(messageModel);
        console.log('fwd', result);
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
        this.messagesService.loadOldMessages(this.selectedPeerId);
    }

    changePhotoSize(img: HTMLImageElement, photo: any): void {
        if (img.src === photo.photo_130) {
            img.src = photo.photo_604;
            img.classList.add('zoom_out');
            img.classList.remove('zoom_in');
        } else if (img.src === photo.photo_604) {
            img.src = photo.photo_130;
            img.classList.add('zoom_in');
            img.classList.remove('zoom_out');
        }
    }

    floor(x: number) {
        return Math.floor(x);
    }

    errorHandler(error): void {
        console.error('An error occurred', error);
    }
}
