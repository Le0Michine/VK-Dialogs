import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription } from "rxjs/Subscription";
import { Message, Chat } from "./message";
import { Dialog, DialogToShow } from "./dialog";
import { User } from "./user";
import { DialogComponent } from "./dialog.component";
import { UserService } from "./user-service";
import { VKService } from "./vk-service";
import { DialogService } from "./dialogs-service";
import { ChromeAPIService } from "../app.background/chrome-api-service";
import { DateConverter } from "./date-converter";
import { VKConsts } from "./vk-consts";

@Component({
  selector: "dialogs",
  templateUrl: "dialogs.component.html",
  styleUrls: ["dialogs.component.css"]
})
export class DialogsComponent implements OnInit, OnDestroy {
    title = "Dialogs";
    user: User = new User();
    users: {};
    chats: {};
    dialogs_count: number;
    is_destroyed: boolean = false;

    dialogs_to_show = [];

    i: number = 0;

    dialogs: Dialog[] = [];

    subscriptions: Subscription[] = [];

    constructor(
        private user_service: UserService,
        private router: Router,
        private vkservice: VKService,
        private dialog_service: DialogService,
        private chromeapi: ChromeAPIService,
        private change_detector: ChangeDetectorRef) { }

    gotoDialog(dialog: Message) {
        let link: string[];
        let chat = dialog as Chat;
        if (chat.chat_id) {
            link = ["/dialog", chat.chat_id.toString(), "chat", chat.title];
        }
        else {
            let user: User = this.users[dialog.user_id];
            let title: string = !dialog.title || dialog.title === " ... " ? user.first_name + " " + user.last_name : dialog.title;
            link = [
                "/dialog",
                dialog.user_id.toString(),
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
        if (window.localStorage.getItem(VKConsts.user_denied) === "true" || this.vkservice.getSession() == null) {
            this.router.navigate(["/authorize"]);
            return;
        }

        this.vkservice.setOnline();

        this.chromeapi.SendRequest({ name: "last_opened" }).subscribe((response: any) => {
            if (response.last_opened) {
                let last_opened = response.last_opened;
                this.router.navigate(["/dialog", last_opened.id, last_opened.type, last_opened.title]);
            }
        });

        this.chromeapi.SendRequest({ name: "request_everything" }).subscribe((response: any) => {
            console.log("got everything: ", response);
            this.users = response.users;
            this.dialogs = response.dialogs;
            this.chats = response.chats;
            this.user = this.users[response.current_user_id];
            this.dialogs_to_show = this.getDialogs();
            this.refreshView();
        });

        this.subscriptions.push(this.dialog_service.dialogs_observable.subscribe(dialogs => {
                console.log("DIALOGS", dialogs);
                this.dialogs = dialogs as Dialog[];
                this.dialogs_to_show = this.getDialogs();
                this.refreshView();
            },
            error => this.errorHandler(error),
            () => console.log("finished dialogs update")
        ));

        this.subscriptions.push(this.user_service.users_observable.subscribe(users => {
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

        this.dialog_service.subscribeOnDialogsCountUpdate(count => this.dialogs_count = count);
    }

    ngOnDestroy() {
        console.log("dialogs component destroy");
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.is_destroyed = true;
        this.chromeapi.Disconnect();
    }

    refreshView() {
        if (!this.is_destroyed) {
            this.change_detector.detectChanges();
        }
    }

    getUserName(uid: number) {
        if (this.users && this.users[uid]) {
            return this.users[uid].first_name + " " + this.users[uid].last_name;
        }
        return "loading...";
    }

    getUserFirstName(uid: number) {
        if (this.users && this.users[uid]) {
            return this.users[uid].first_name;
        }
        return "loading...";
    }

    getUserPhoto(uid: number) {
        if (this.users && this.users[uid] && this.users[uid].photo_50) {
            return this.users[uid].photo_50;
        }
        return "http://vk.com/images/camera_c.gif";
    }

    getDialogs() {
        if (!this.users) return [];
        let dialogs: DialogToShow[] = [];
        for (let dialog of this.dialogs) {
            let uid = dialog.message.user_id;
            let dts = new DialogToShow();
            dts.message = dialog.message;
            dts.unread = dialog.unread;
            dts.title = !dialog.message.title || dialog.message.title === " ... " ? this.getUserName(uid) : dialog.message.title;
            dts.date_format = DateConverter.formatDate(Number(dialog.message.date));
            dts.sender = dialog.message.out ? this.user.first_name : this.getUserFirstName(uid);

            if (dialog.message.fwd_messages) {
                dts.attachment_type = "fwd_messages";
            }
            else if (dialog.message.attachments && dialog.message.attachments[0]) {
                dts.attachment_type = dialog.message.attachments[0].type;
            }
            dts.attachment_only = dts.attachment_type !== "" && dts.message.body === "";

            let chat = dialog.message as Chat;
            if (chat.chat_id) {
                dts.online = false;
                if (chat.photo_50) {
                    dts.photos = [chat.photo_50];
                }
                else if (this.chats && this.chats[chat.chat_id] && this.chats[chat.chat_id].users.length > 0) {
                    dts.photos = (this.chats[chat.chat_id].users as User[]).filter(user => user.id !== this.user.id).map(user => user.photo_50).slice(0, 4);
                }
                if (this.chats && this.chats[chat.chat_id] && this.chats[chat.chat_id].users.length === 0 && chat.action) {
                    chat.read_state = true;
                }
            }
            else if (this.users && this.users[uid] && this.users[uid].photo_50) {
                dts.photos = [this.users[uid].photo_50];
                dts.online = this.users[uid].online;
            }
            dialogs.push(dts);
        }
        return dialogs;
    }

    errorHandler(error) {
        console.error("An error occurred", error);
        // return Promise.reject(error.message || error);
    }
}
