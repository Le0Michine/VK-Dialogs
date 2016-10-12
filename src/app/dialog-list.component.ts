import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { Subscription } from "rxjs/Subscription";
import { DialogInfo, UserInfo, ChatInfo, DialogView, SingleMessageInfo } from "./datamodels/datamodels";
import { DialogComponent } from "./dialog.component";
import { UserService } from "./user-service";
import { VKService } from "./vk-service";
import { DialogService } from "./dialogs-service";
import { ChromeAPIService } from "./chrome-api-service";
import { VKConsts } from "./vk-consts";

@Component({
  selector: "dialogs",
  templateUrl: "dialog-list.component.html",
  styleUrls: ["dialog-list.component.css", "css/color-scheme.css"]
})
export class DialogListComponent implements OnInit, OnDestroy {
    user: UserInfo = new UserInfo();
    users: { [userId: number] : UserInfo };
    chats: { [chatId: number] : ChatInfo };
    dialogs_count: number;
    is_destroyed: boolean = false;

    dialogs_to_show: DialogView[] = [];

    i: number = 0;

    dialogs: DialogInfo[] = [];

    subscriptions: Subscription[] = [];

    constructor(
        private user_service: UserService,
        private router: Router,
        private title: Title,
        private vkservice: VKService,
        private dialog_service: DialogService,
        private chromeapi: ChromeAPIService,
        private change_detector: ChangeDetectorRef) { }

    gotoDialog(dialog: SingleMessageInfo) {
        let link: string[];
        if (dialog.chatId) {
            link = ["dialog", dialog.chatId.toString(), "chat", dialog.title];
        }
        else {
            let user: UserInfo = this.users[dialog.userId];
            let title: string = !dialog.title || dialog.title === " ... " ? user.firstName + " " + user.lastName : dialog.title;
            this.title.setTitle(title);
            link = [
                "dialog",
                dialog.userId.toString(),
                "dialog",
                title];
        }
        this.router.navigate(link);
    }

    loadOldDialogs() {
        this.dialog_service.loadOldDialogs();
    }

    track(d, i) {
        return d.message.id;
    }

    ngOnInit() {
        console.trace("init dialogs component");
        this.vkservice.init();

        console.log("authorized, continue initialization");

        this.dialog_service.init();
        this.title.setTitle("Dialogs");

        if (window.localStorage.getItem(VKConsts.user_denied) === "true" || !this.vkservice.hasValidSession()) {
            console.log("navigate to login page");
            setTimeout(() => this.router.navigate(["authorize"]), 0);
            //this.router.navigate(["authorize"]);
            return;
        }

        this.vkservice.setOnline();

        this.chromeapi.SendRequest({ name: "last_opened" }).subscribe((response: any) => {
            if (response.last_opened) {
                let last_opened = response.last_opened;
                this.router.navigate(["dialog", last_opened.id, last_opened.type, last_opened.title]);
            }
        });

        this.subscriptions.push(this.dialog_service.dialogs_observable.subscribe(dialogs => {
                console.log("DIALOGS", dialogs);
                this.dialogs = dialogs.dialogs;
                this.dialogs_count = dialogs.count;
                this.dialogs_to_show = this.getDialogs();
                this.refreshView();
            },
            error => this.errorHandler(error),
            () => console.log("finished dialogs update")
        ));

        this.subscriptions.push(this.user_service.getUsers().subscribe(users => {
                    this.users = users;
                    this.dialogs_to_show = this.getDialogs();
                    this.refreshView();
                },
                error => this.errorHandler(error),
                () => console.log("finished users update")
            )
        );

        this.subscriptions.push(this.dialog_service.chat_observable.subscribe(chats => {
                this.chats = chats;
                this.dialogs_to_show = this.getDialogs();
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
        this.is_destroyed = true;
        this.chromeapi.PostPortMessage("store_current_message");
    }

    refreshView() {
        if (!this.is_destroyed) {
            this.change_detector.detectChanges();
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
        if (!this.users) return [];
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
                dts.attachment_type = "fwd_messages";
            }
            else if (message.attachments && message.attachments[0]) {
                dts.attachment_type = message.attachments[0].type;
            }
            dts.attachment_only = dts.attachment_type !== "" && dts.message.body === "";

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
