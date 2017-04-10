import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { go } from '@ngrx/router-store';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '../../../app.shared/translate';
import { Subscription } from 'rxjs/Rx';

import { DialogInfo, UserInfo, ChatInfo, DialogView, SingleMessageInfo, UserSex } from '../datamodels';
import { VKService, DialogService, ChromeAPIService } from '../services';
import { VKConsts } from '../../../app.shared/datamodels';
import { AppState } from '../app.store';
import { BreadcrumbActions, HistoryActions, CurrentConversationIdActions } from '../app.store';

@Component({
  selector: 'app-dialogs',
  templateUrl: 'dialog-list.component.html',
  styleUrls: ['dialog-list.component.scss']
})
export class DialogListComponent implements OnInit, OnDestroy {
    user: UserInfo = {} as UserInfo;
    users: { [userId: number]: UserInfo };
    chats: { [chatId: number]: ChatInfo };
    dialogsCount: number;
    isDestroyed = false;

    dialogsToShow: DialogView[] = [];

    i = 0;

    dialogs: DialogInfo[] = [];

    subscriptions: Subscription[] = [];

    constructor(
        private title: Title,
        private vkservice: VKService,
        private dialogService: DialogService,
        private chromeapi: ChromeAPIService,
        private changeDetector: ChangeDetectorRef,
        private store: Store<AppState>,
        private translate: TranslateService
    ) { }

    gotoDialog(dialog: SingleMessageInfo) {
        let link: string[];
        if (dialog.chatId) {
            link = ['dialogs', 'chat', dialog.peerId.toString(), dialog.title];
        } else {
            const user: UserInfo = this.users[dialog.userId];
            const title: string = !dialog.title || dialog.title === ' ... ' ? user.firstName + ' ' + user.lastName : dialog.title;
            this.title.setTitle(title);
            link = [
                'dialogs',
                'dialog',
                dialog.userId.toString(),
                title];
        }
        this.store.dispatch(go(link));
        this.store.dispatch({ type: CurrentConversationIdActions.UPDATED, payload: dialog.peerId });
    }

    loadOldDialogs() {
        this.dialogService.loadOldDialogs();
    }

    track(d, i) {
        return d.message.id;
    }

    ngOnInit() {
        this.vkservice.init();

        this.dialogService.init();

        this.translate.get('dialogs').subscribe(value => {
            this.store.dispatch({ type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: [] });
            this.title.setTitle(value);
        });

        this.vkservice.setOnline();

        this.subscriptions.push(this.store.select(s => s.dialogs).subscribe(dialogs => {
                console.log('DIALOGS', dialogs);
                this.dialogs = dialogs.dialogs;
                this.dialogsCount = dialogs.count;
                this.dialogsToShow = this.getDialogs();
                this.refreshView();
            },
            error => this.errorHandler(error),
            () => console.log('finished dialogs update')
        ));

        this.subscriptions.push(this.store.select(s => s.users).subscribe(users => {
                    console.log('USERS', users);
                    this.users = users.users;
                    this.dialogsToShow = this.getDialogs();
                    this.refreshView();
                },
                error => this.errorHandler(error),
                () => console.log('finished users update')
            )
        );

        this.subscriptions.push(this.store.select(s => s.chats).subscribe(chats => {
                this.chats = chats.chats;
                this.dialogsToShow = this.getDialogs();
                this.refreshView();
            },
            error => this.errorHandler(error),
            () => console.log('finished chats update'))
        );
    }

    ngOnDestroy() {
        console.log('dialogs component destroy');
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.isDestroyed = true;
    }

    refreshView() {
        if (!this.isDestroyed) {
            this.changeDetector.detectChanges();
        }
    }

    getUserName(uid: number) {
        if (this.users && this.users[uid]) {
            return this.users[uid].firstName + ' ' + this.users[uid].lastName;
        }
        return 'loading...';
    }

    getUserFirstName(uid: number) {
        if (this.users && this.users[uid]) {
            return this.users[uid].firstName;
        }
        console.warn('unable to get user name', uid, this.users);
        return 'loading...';
    }

    getUserPhoto(uid: number) {
        if (this.users && this.users[uid] && this.users[uid].photo50) {
            return this.users[uid].photo50;
        }
        return 'http://vk.com/images/camera_c.gif';
    }

    public getUserSex(uid: number): UserSex {
        return (this.users[uid] || { sex: UserSex.undefined }).sex;
    }

    getDialogs(): DialogView[] {
        if (!this.users) {
            console.log('not enough data');
            return [];
        }
        const dialogs: DialogView[] = [];
        for (const dialog of this.dialogs) {
            const uid = dialog.message.userId;
            const message = dialog.message;
            const dts = new DialogView();
            dts.message = message;
            dts.unread = dialog.unreadCount;
            dts.title = !message.title || message.title === ' ... ' ? this.getUserName(uid) : message.title;
            dts.sender = this.getUserFirstName(message.fromId);

            if (message.fwdMessages) {
                dts.attachmentType = 'fwd_messages';
            } else if (message.attachments && message.attachments[0]) {
                dts.attachmentType = message.attachments[0].type;
            }
            dts.attachmentOnly = dts.attachmentType !== '' && dts.message.body === '';

            if (message.chatId) {
                dts.online = false;
                if (message.photo50) {
                    dts.photos = [message.photo50];
                } else if (this.chats && this.chats[message.chatId] && this.chats[message.chatId].users.length > 0) {
                    // tslint:disable-next-line:max-line-length
                    dts.photos = (this.chats[message.chatId].users).filter(user => user.id !== this.user.id).map(user => user.photo50).slice(0, 4);
                }
                if (this.chats && this.chats[message.chatId] && this.chats[message.chatId].users.length === 0 && message.action) {
                    message.isRead = true;
                }
            } else if (this.users && this.users[uid] && this.users[uid].photo50) {
                dts.photos = [this.users[uid].photo50];
                dts.online = this.users[uid].isOnline;
            }
            dialogs.push(dts);
        }
        return dialogs;
    }

    errorHandler(error): void {
        console.error('An error occurred', error);
    }
}
