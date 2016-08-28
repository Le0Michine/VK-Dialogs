import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import { Message, MessageToShow } from "./message";
import { User } from "./user";
import { DialogService } from "./dialogs-service";
import { UserService } from "./user-service";
import { VKService } from "./vk-service";
import { Channels } from "../app.background/channels";
import { DateConverter } from "./date-converter";

@Component({
    selector: "messages",
    templateUrl: "app/dialog.component.html",
    styleUrls: [
        "app/dialog.component.css",
        "app/dialog.component.input.css",
        "app/dialog.component.header.css"
    ]
})
export class DialogComponent {
    title = "Dialog";
    participants: {} = {};
    user_id: string;
    history: Message[] = [];
    is_chat: boolean;
    conversation_id: number;
    current_text: string = "";
    messages_count: number;
    subscriptions: Subscription[] = [];

    history_to_show: MessageToShow[] = [];

    constructor (
        private messages_service: DialogService,
        private vkservice: VKService,
        private user_service: UserService,
        private route: ActivatedRoute,
        private change_detector: ChangeDetectorRef) { }

    ngOnInit() {
        console.log("specific dialog component init");
        this.user_id = this.vkservice.getSession().user_id;
        let sub = this.route.params.subscribe(params => {
            this.title = params["title"];
            let id = +params["id"];
            let type = params["type"];
            let participants = params["participants"];
            let isChat: boolean = type === "dialog" ? false : true;
            this.is_chat = isChat;
            this.conversation_id = id;

            this.restoreCachedMessages(id, isChat);

            this.subscriptions.push(this.messages_service.history_observable.subscribe(history => {
                    this.history = history as Message[];
                    this.history_to_show = this.getHistory(this.history);
                    console.log("history converted");
                    console.log("force update 1");
                    this.change_detector.detectChanges();
                })
            );
            this.messages_service.setCurrentConversation(this.conversation_id, this.is_chat);

            this.subscriptions.push(this.user_service.users_observable.subscribe(users => {
                    this.participants = users;
                    this.history_to_show = this.getHistory(this.history);
                    console.log("force update 2");
                    this.change_detector.detectChanges();
                },
                error => this.errorHandler(error),
                () => console.log("finished users update")
            ));
            this.user_service.requestUsers();

            this.messages_service.subscribeOnMessagesCountUpdate(count => this.messages_count = count);
        });
        this.subscriptions.push(sub);
    }

    ngOnDestroy() {
        console.log("specific dialog component destroy");
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
    }

    restoreCachedMessages(id, isChat) {
        let key = "cached_message_" + id + isChat;
        let value = {};
        value[key] = "";

        chrome.storage.sync.get(value, (value: any) => {
            console.log("restored message: ", value);
            if (value[key]) {
                this.clearLabelContent();
                this.current_text = value[key] as string;
            }
            this.updateCachedMessage();
        });
    }

    getHistory(messages: Message[]) {
        console.log("convert history");
        if (messages.length === 0 || !this.participants[messages[0].user_id]) {
            return [];
        }
        let history: MessageToShow[] = [];
        let mts = new MessageToShow();
        let uid = messages[0].from_id;
        mts.user = this.participants[uid] || new User();
        mts.date = messages[0].date;

        for (let message of messages) {
            if (message.from_id === uid
                && (mts.messages.length === 0 || (Math.abs(message.date - mts.messages[0].date) < 60 * 5))) {
                    message.attachments = this.getMessageAttachments(message);
                    mts.messages.push(message);
            }
            else {
                history.push(mts);
                mts = new MessageToShow();
                mts.user = this.participants[message.from_id] || new User();
                mts.messages.push(message);
                mts.date = message.date;
                uid = message.from_id;
            }
        }
        history.push(mts);
        console.log("history: ", history);
        return history;
    }

    getMessageAttachments(message: Message) {
        console.log("get attachments");
        let attachments = [];
        if (message.attachments) {
            for (let attachment of message.attachments) {
                if (attachment.photo || attachment.doc ||
                        attachment.wall || attachment.link ||
                        attachment.video || attachment.sticker ||
                        attachment.audio) {
                    attachments.push(attachment);
                }
                else {
                    attachments.push("[" + attachment.type + "]");
                }
            }
        }
        if (message.fwd_messages) {
            let attachment: any = {};
            attachment.type = "fwd";
            attachment.fwd = this.convertFwdMessages(message.fwd_messages);
            attachment.fwd = message.fwd_messages;
            attachments.push(attachment);
            console.log("fwd: ", attachment);
        }
        return attachments;
    }

    convertFwdMessages(messages: any[]) {
        /** body, date, user_id, attachments */
        console.log("convert forwarded messages");
        let result: any[] = [];
        if (!messages || messages.length === 0) return [];
        let mts: any = {};
        mts.date = messages[0].date;
        mts.user = this.participants[messages[0].user_id] || new User();
        mts.user_id = messages[0].user_id;
        mts.messages = [messages[0]];
        for (let i = 1; i < messages.length; i++) {
            if (mts.user_id === messages[i].user_id) {
                messages[i].attachments = this.getMessageAttachments(messages[i]);
                mts.messages.push(messages[i]);
            }
            else {
                result.push(mts);
                mts = {};
                mts.date = messages[i].date;
                mts.user = this.participants[messages[i].user_id] || new User();
                mts.user_id = messages[0].user_id;
                mts.messages = [messages[i]];
            }
        }
        result.push(mts);
        return result;
    }

    goBack() {
        this.cacheCurrentMessage();
        window.history.back();
    }

    getUserName(uid: number) {
        if (this.participants && this.participants[uid]) {
            return this.participants[uid].first_name;
        }
        return "loading...";
    }

    getUserPhoto(uid: number) {
        if (this.participants && this.participants[uid] && this.participants[uid].photo_50) {
            return this.participants[uid].photo_50;
        }
        return "http://vk.com/images/camera_c.gif";
    }

    clearLabelContent() {
        console.log("clear label");
        let label = document.getElementById("input_label");
        label.innerText = "";
    }

    sendMessage() {
        let messageInput = document.getElementById("message_input") as HTMLDivElement;
        let text = messageInput.innerText.trim()
            .replace(/%/g,  "%25")
            .replace(/\n/g, "%0A")
            .replace(/!/g,  "%21")
            .replace(/"/g,  "%22")
            .replace(/#/g,  "%23")
            .replace(/\$/g, "%24")
            .replace(/&/g,  "%26")
            .replace(/'/g,  "%27")
            .replace(/\(/g, "%28")
            .replace(/\)/g, "%29")
            .replace(/\*/g, "%2A")
            .replace(/\+/g, "%2B")
            .replace(/,/g,  "%2C")
            .replace(/-/g,  "%2D");

        if (!text || text === "") {
            console.log("message text is empty, nothing to send");
            return;
        }
        this.messages_service.sendMessage(this.conversation_id, text, this.is_chat).subscribe(
            message => console.log("result: " + JSON.stringify(message)),
            error => this.errorHandler(error),
            () => {
                console.log("message sent");
                messageInput.innerText = "";
                this.clearCache();
            });
    }

    onKeyPress(event, value) {
        if (event.keyCode === 13 && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    updateCachedMessage() {
        let addListener = (element, event, handler) => element.addEventListener(event, handler, false);
        let input = document.getElementById("message_input") as HTMLDivElement;

        let updateValue = () => {
            this.current_text = input.innerText;
            this.cacheCurrentMessage();
        };

        /* small timeout to get the already changed text */
        let delayedUpdate = () => { window.setTimeout(updateValue, 100); };

        /* listen for every event which is fired after text is changed */
        addListener(input, "change",  delayedUpdate);
        addListener(input, "cut",     delayedUpdate);
        addListener(input, "paste",   delayedUpdate);
        addListener(input, "drop",    delayedUpdate);
        addListener(input, "keydown", delayedUpdate);

        /* need to set value immidiately before initial resizing */
        input.innerText = this.current_text;
    }

    cacheCurrentMessage() {
        let key = "cached_message_" + this.conversation_id + this.is_chat;
        let value = {};
        value[key] = this.current_text;
        chrome.storage.sync.set(value);
    }

    clearCache() {
        let key: string = "cached_message_" + this.conversation_id + this.is_chat;
        chrome.storage.sync.remove(key);
    }

    formatDate(unixtime: number) {
        return DateConverter.formatDate(unixtime);
    }

    markAsRead() {
        let ids = [];
        for (let m of this.history) {
            if (m.out || m.read_state) break;
            ids.push(m.id);
        }
        if (ids.length === 0) {
            console.log("unread messages was not found");
        }
        this.messages_service.markAsRead(ids.join()).subscribe(result => {
            if (result) {
            }
            else {
                console.log("failed to mark messages as read");
            }
        });
    }

    loadOldMessages() {
        this.messages_service.loadOldMessages();
    }

    changePhotoSize(img: HTMLImageElement, photo: any) {
        if (img.src === photo.photo_130) {
            img.src = photo.photo_604;
            img.classList.add("zoom_out");
            img.classList.remove("zoom_in");
        }
        else if (img.src === photo.photo_604) {
            img.src = photo.photo_130;
            img.classList.add("zoom_in");
            img.classList.remove("zoom_out");
        }
    }

    floor(x: number) {
        return Math.floor(x);
    }

    cutLinks(text: string) {
        let len = 55;
        let urls = text.match(/(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-ZА-Яа-я\w0-9+&@#\/%=~_|$?!:,.]*\)|[-A-ZА-Яа-я\w0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-ZА-Яа-я\w0-9+&@#\/%=~_|$?!:,.]*\)|[A-ZА-Яа-я\w0-9+&@#\/%=~_|$])/igm);
        if (!urls) return text;
        for (let url of urls) {
            text = text.replace(url,
                "<a target=\"_blank\" href=\"" + url + "\" title=\"" + url + "\" style=\"cursor:pointer;\">" + (url.length > len ? (url.slice(0, len) + "..") : url) + "</a>");
        }
        return text;
    }

    errorHandler(error) {
        console.error("An error occurred", error);
        return Promise.reject(error.message || error);
    }
}