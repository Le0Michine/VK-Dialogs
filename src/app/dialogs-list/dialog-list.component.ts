import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Store } from "@ngrx/Store";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { TranslateService } from "ng2-translate/ng2-translate";
import { Subscription } from "rxjs/Subscription";
import "rxjs/add/operator/combineLatest";

import { DialogInfo, UserInfo, ChatInfo, DialogView, SingleMessageInfo } from "../datamodels";
import { UserService, VKService, DialogService, ChromeAPIService } from "../services";
import { VKConsts } from "../vk-consts";
import { AppStore } from "../app.store";
import { BreadcrumbActions, HistoryActions } from "../reducers";

@Component({
  selector: "dialogs",
  templateUrl: "dialog-list.component.html",
  styleUrls: ["dialog-list.component.css", "../css/color-scheme.css"]
})
export class DialogListComponent implements OnInit, OnDestroy {
    user: UserInfo = new UserInfo();
    users: { [userId: number]: UserInfo };
    chats: { [chatId: number]: ChatInfo };
    dialogsCount: number;
    isDestroyed: boolean = false;

    dialogsToShow: DialogView[] = [];

    i: number = 0;

    dialogs: DialogInfo[] = [];

    subscriptions: Subscription[] = [];

    constructor(
        private userService: UserService,
        private router: Router,
        private title: Title,
        private vkservice: VKService,
        private dialogService: DialogService,
        private chromeapi: ChromeAPIService,
        private changeDetector: ChangeDetectorRef,
        private store: Store<AppStore>,
        private translate: TranslateService
    ) { }

    gotoDialog(dialog: SingleMessageInfo) {
        let link: string[];
        if (dialog.chatId) {
            link = ["dialogs", "chat", dialog.chatId.toString(), dialog.title];
        }
        else {
            let user: UserInfo = this.users[dialog.userId];
            let title: string = !dialog.title || dialog.title === " ... " ? user.firstName + " " + user.lastName : dialog.title;
            this.title.setTitle(title);
            link = [
                "dialogs",
                "dialog",
                dialog.userId.toString(),
                title];
        }
        this.router.navigate(link);
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

        this.translate.get("dialogs").subscribe(value => {
            this.store.dispatch({ type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: [{ title: value, href: "https://vk.com/im" }] });
            this.title.setTitle(value);
        });

        this.vkservice.setOnline();

        this.chromeapi.SendRequest({ name: "last_opened" }).subscribe((response: any) => {
            if (response.last_opened) {
                let lastOpened = response.last_opened;
                this.router.navigate(["dialogs", lastOpened.type, lastOpened.id, lastOpened.title]);
            } else {
                this.store.dispatch({ type: HistoryActions.HISTORY_LOADED, payload: null });
            }
        });

        this.subscriptions.push(this.dialogService.dialogsObservable.subscribe(dialogs => {
                console.log("DIALOGS", dialogs);
                this.dialogs = dialogs.dialogs;
                this.dialogsCount = dialogs.count;
                this.dialogsToShow = this.getDialogs();
                this.refreshView();
            },
            error => this.errorHandler(error),
            () => console.log("finished dialogs update")
        ));

        this.subscriptions.push(this.userService.getUsers().subscribe(users => {
                    console.log("USERS", users);
                    this.users = users;
                    this.dialogsToShow = this.getDialogs();
                    this.refreshView();
                },
                error => this.errorHandler(error),
                () => console.log("finished users update")
            )
        );

        this.subscriptions.push(this.dialogService.chatObservable.subscribe(chats => {
                this.chats = chats;
                this.dialogsToShow = this.getDialogs();
                this.refreshView();
            },
            error => this.errorHandler(error),
            () => console.log("finished chats update"))
        );
    }

    ngOnDestroy() {
        console.log("dialogs component destroy");
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.isDestroyed = true;
        this.chromeapi.PostPortMessage("store_current_message");
    }

    refreshView() {
        if (!this.isDestroyed) {
            this.changeDetector.detectChanges();
        }
    }

    getUserName(uid: number) {
        if (this.users && this.users[uid]) {
            return this.users[uid].firstName + " " + this.users[uid].lastName;
        }
        return "loading...";
    }

    getUserFirstName(uid: number) {
        if (this.users && this.users[uid]) {
            return this.users[uid].firstName;
        }
        console.warn("unable to get user name", uid, this.users);
        return "loading...";
    }

    getUserPhoto(uid: number) {
        if (this.users && this.users[uid] && this.users[uid].photo50) {
            return this.users[uid].photo50;
        }
        return "http://vk.com/images/camera_c.gif";
    }

    getDialogs(): DialogView[] {
        if (!this.users) {
            console.log("not enough data");
            return [];
        }
        let dialogs: DialogView[] = [];
        for (let dialog of this.dialogs) {
            let uid = dialog.message.userId;
            let message = dialog.message;
            let dts = new DialogView();
            dts.message = message;
            dts.unread = dialog.unreadCount;
            dts.title = !message.title || message.title === " ... " ? this.getUserName(uid) : message.title;
            dts.sender = this.getUserFirstName(message.fromId);

            if (message.fwdMessages) {
                dts.attachmentType = "fwd_messages";
            }
            else if (message.attachments && message.attachments[0]) {
                dts.attachmentType = message.attachments[0].type;
            }
            dts.attachmentOnly = dts.attachmentType !== "" && dts.message.body === "";

            if (message.chatId) {
                dts.online = false;
                if (message.photo50) {
                    dts.photos = [message.photo50];
                }
                else if (this.chats && this.chats[message.chatId] && this.chats[message.chatId].users.length > 0) {
                    dts.photos = (this.chats[message.chatId].users).filter(user => user.id !== this.user.id).map(user => user.photo50).slice(0, 4);
                }
                if (this.chats && this.chats[message.chatId] && this.chats[message.chatId].users.length === 0 && message.action) {
                    message.isRead = true;
                }
            }
            else if (this.users && this.users[uid] && this.users[uid].photo50) {
                dts.photos = [this.users[uid].photo50];
                dts.online = this.users[uid].isOnline;
            }
            dialogs.push(dts);
        }
        return dialogs;
    }

    errorHandler(error): void {
        console.error("An error occurred", error);
    }
}
