import { Component, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { go } from '@ngrx/router-store';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '../../../app.shared/translate';
import { Subscription, Subject } from 'rxjs/Rx';

// tslint:disable-next-line:max-line-length
import { DialogListFilterInfo, DialogShortInfo, DialogInfo, UserInfo, ChatInfo, DialogView, SingleMessageInfo, UserSex } from '../datamodels';
import { VKService, DialogService, ChromeAPIService } from '../services';
import { selectConversation, updateBreadcrumbs } from '../actions';
import { VKConsts } from '../../../app.shared/datamodels';
import { VKUtils } from '../../../app.shared/vk-utils';
import { AppState } from '../app.store';
import { BreadcrumbActions, HistoryActions, SelectedConversationActions } from '../app.store';

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
    shownDialogsCount = 20;
    showOldDialogsLoadingSpinner = false;

    private subscriptions: Subscription[] = [];

    private minTop = 6;
    private maxTop = 45;
    private lastScrollPosition = 0;
    private currentTop = 45;

    public dialogListFilters: DialogListFilterInfo = {} as DialogListFilterInfo;
    public searchFocus: Subject<boolean> = new Subject();
    public foundDialogs: DialogShortInfo[] = [];

    public get containerHeight(): string {
        return `calc(100% - ${this.currentTop}px)`;
    }

    constructor(
        private title: Title,
        private vkservice: VKService,
        private dialogService: DialogService,
        private chromeapi: ChromeAPIService,
        private changeDetector: ChangeDetectorRef,
        private store: Store<AppState>,
        private translate: TranslateService
    ) { }

    onDialogSelect(dialog: DialogShortInfo) {
        const link = ['dialogs', dialog.type === 'profile' ? 'dialog' : 'chat', dialog.id, dialog.title];
        this.store.dispatch(go(link));
        this.store.dispatch(selectConversation(dialog.title, dialog.id));
    }

    keyDown(event: KeyboardEvent) {
        if (event.ctrlKey && event.keyCode === 70) { // ctrl + f
            event.preventDefault();
            event.stopPropagation();
            this.searchFocus.next(true);
        }
    }

    gotoDialog(dialog: SingleMessageInfo) {
        let link: string[];
        let title = dialog.title;
        if (dialog.chatId) {
            link = ['dialogs', 'chat', dialog.peerId.toString(), dialog.title];
        } else {
            const user: UserInfo = this.users[dialog.userId];
            title = !dialog.title || dialog.title === ' ... ' ? user.firstName + ' ' + user.lastName : dialog.title;
            this.title.setTitle(title);
            link = [
                'dialogs',
                'dialog',
                dialog.userId.toString(),
                title];
        }
        this.store.dispatch(go(link));
        this.store.dispatch(selectConversation(title, dialog.peerId));
    }

    loadOldDialogs() {
        this.shownDialogsCount += 19;
        if (this.dialogs.length >= this.shownDialogsCount) {
            this.convertModel();
        } else {
            this.showOldDialogsLoadingSpinner = true;
            this.dialogService.loadOldDialogs();
        }
    }

    track(d, i) {
        return d.message.id;
    }

    ngOnInit() {
        this.vkservice.init();

        this.dialogService.init();

        this.translate.get('dialogs').subscribe(value => {
            this.store.dispatch(updateBreadcrumbs([{title: 'dialogs', href: 'https://vk.com/im', translatable: true}]));
            this.title.setTitle(value);
        });

        this.vkservice.setOnline();

        this.subscriptions.push(this.store.select(s => s.dialogs).subscribe(dialogs => {
                console.log('DIALOGS', dialogs);
                this.dialogs = dialogs.dialogs;
                this.dialogsCount = dialogs.count;
                this.convertModel();
                this.refreshView();
            },
            error => this.errorHandler(error),
            () => console.log('finished dialogs update')
        ));

        this.subscriptions.push(this.store.select(s => s.users).subscribe(users => {
                    console.log('USERS', users);
                    this.users = users.users;
                    this.convertModel();
                    this.refreshView();
                },
                error => this.errorHandler(error),
                () => console.log('finished users update')
            )
        );

        this.subscriptions.push(this.store.select(s => s.chats).subscribe(chats => {
                this.chats = chats.chats;
                this.convertModel();
                this.refreshView();
            },
            error => this.errorHandler(error),
            () => console.log('finished chats update'))
        );

        this.subscriptions.push(this.store.select(s => s.dialogsFilter).subscribe(f => {
            this.dialogListFilters = f;
        }));
    }

    ngOnDestroy() {
        console.log('dialogs component destroy');
        for (const sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.isDestroyed = true;
    }

    convertModel() {
        if (this.dialogs.length >= this.shownDialogsCount) {
            this.showOldDialogsLoadingSpinner = false;
        }
        this.dialogsToShow = this.getDialogs(this.dialogs.slice(0, this.shownDialogsCount));
    }

    refreshView() {
        if (!this.isDestroyed) {
            this.changeDetector.detectChanges();
        }
    }

    getUserName(uid: number): string {
        if (this.users && this.users[uid]) {
            return this.users[uid].fullName;
        }
        return `${uid}`;
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
        return VKUtils.getAvatarPlaceholder();
    }

    public trackByDialogId(dialog: DialogView) {
        return dialog && dialog.message ? dialog.message.peerId : null;
    }

    public getUserSex(uid: number): UserSex {
        return (this.users[uid] || { sex: UserSex.undefined }).sex;
    }

    public onScroll(event): void {
        const scrollDelta = this.lastScrollPosition - event.target.scrollTop;
        this.lastScrollPosition = event.target.scrollTop;
        this.currentTop = Math.max(this.minTop, Math.min(this.maxTop, this.currentTop + scrollDelta));
    }

    public search(searchTerm: string): void {
        this.subscriptions.push(this.dialogService.searchDialog(searchTerm).subscribe(result => {
            console.log('got search result', result);
            this.foundDialogs = result;
            this.changeDetector.detectChanges();
        }));
    }

    public getDialogs(data: DialogInfo[]): DialogView[] {
        if (!this.users) {
            console.log('not enough data');
            return [];
        }
        const dialogs: DialogView[] = [];
        for (const dialog of data) {
            const uid = dialog.message.userId;
            const message = dialog.message;
            const dts = new DialogView();
            // dts.peerId = message.peerId;
            dts.message = message;
            dts.unread = dialog.unreadCount;
            dts.title = (!message.title || message.title === ' ... ') ? this.getUserName(uid) : message.title;
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

    public onFilterUnreadChange(value: boolean) {
        this.dialogListFilters.unread = value;
        this.dialogService.setDialogListFilter({ unread: value });
    }

    errorHandler(error): void {
        console.error('An error occurred', error);
    }
}
