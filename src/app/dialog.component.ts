import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, Renderer } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import { Message, MessageToShow } from "./message";
import { User } from "./user";
import { DialogService } from "./dialogs-service";
import { UserService } from "./user-service";
import { VKService } from "./vk-service";
import { Channels } from "../app.background/channels";
import { ChromeAPIService } from "../app.background/chrome-api-service";
import { DateConverter } from "./date-converter";

@Component({
    selector: "messages",
    templateUrl: "dialog.component.html",
    styleUrls: [
        "dialog.component.css",
        "dialog.component.input.css",
        "dialog.component.header.css"
    ]
})
export class DialogComponent implements OnInit, OnDestroy {
    @ViewChild("minput") input: ElementRef;

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

    message_is_sending: boolean = false;

    constructor (
        private messages_service: DialogService,
        private vkservice: VKService,
        private user_service: UserService,
        private route: ActivatedRoute,
        private change_detector: ChangeDetectorRef,
        private chromeapi: ChromeAPIService,
        private renderer: Renderer) { }

    ngOnInit() {
        console.log("specific dialog component init");
        this.user_id = this.vkservice.getSession().user_id;
        let sub = this.route.params.subscribe(params => {
            this.title = params["title"];
            this.conversation_id = +params["id"];
            let type = params["type"];
            this.is_chat = type === "dialog" ? false : true;

            this.chromeapi.SendMessage({
                name: "last_opened",
                last_opened: {
                    id: this.conversation_id,
                    title: this.title,
                    type: this.is_chat ? "chat" : "dialog"
                }
            });

            this.restoreCachedMessages(this.conversation_id, this.is_chat);

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

            this.messages_service.subscribeOnMessagesCountUpdate(count => this.messages_count = count);
        });
        this.subscriptions.push(sub);
    }

    ngAfterViewInit() {
        this.renderer.invokeElementMethod(this.input.nativeElement, "focus");
    }

    ngOnDestroy() {
        console.log("specific dialog component destroy");
        for (let sub of this.subscriptions) {
            sub.unsubscribe();
        }
        this.chromeapi.Disconnect();
    }

    restoreCachedMessages(id, isChat) {
        let key = "cached_message_" + id + isChat;
        let value = {};
        value[key] = "";

        chrome.storage.sync.get(value, (value: any) => {
            console.log("restored message: ", value);
            if (value[key]) {
                this.hideLabelContent();
                this.current_text = value[key] as string;
            }
            this.updateCachedMessage();
        });
    }

    getHistory(messages: Message[]) {
        console.log("convert history: ", messages);
        if (!messages.length || !this.participants[messages[0].user_id]) {
            return [];
        }
        let history: MessageToShow[] = [];
        let mts = new MessageToShow();
        let uid = messages[0].from_id;
        mts.user = this.participants[uid] || new User();
        mts.date = messages[0].date;

        for (let message of messages) {
            message.attachments = this.getMessageAttachments(message);
            if (message.from_id === uid
                && (mts.messages.length === 0
                    || (Math.abs(message.date - mts.messages[mts.messages.length - 1].date) < 60 * 5
                        && message.read_state === mts.messages[mts.messages.length - 1].read_state))) {
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
                else if (!attachment.fwd) {
                    attachments.push("[" + attachment.type + "]");
                }
            }
        }
        if (message.fwd_messages) {
            let attachment: any = {};
            attachment.type = "fwd";
            attachment.fwd = this.convertFwdMessages(message.fwd_messages);
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
        messages[0].attachments = this.getMessageAttachments(messages[0]);
        mts.messages = [messages[0]];
        for (let i = 1; i < messages.length; i++) {
            messages[i].attachments = this.getMessageAttachments(messages[i]);
            if (mts.user_id === messages[i].user_id) {
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
        this.chromeapi.SendMessage({
            name: "last_opened",
            last_opened: null,
            go_back: true
        });
        this.cacheCurrentMessage();
        window.history.back();
        this.ngOnDestroy();
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

    hideLabelContent() {
        let label = document.getElementById("input_label");
        label.style.display = "none";
    }

    showLabelContent(content: string) {
        if (content) return;
        let label = document.getElementById("input_label");
        label.style.display = "block";
    }

    sendMessage() {
        if (this.message_is_sending) return;
        this.message_is_sending = true;

        let text = this.getInputMessage().trim()
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
            message => console.log("result: ", message),
            error => {
                this.errorHandler(error);
                this.message_is_sending = false;
            },
            () => {
                console.log("message sent");
                this.clearCache();
                this.updateInputMessage();
                this.message_is_sending = false;
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
        let input_box = document.getElementById("input_box") as HTMLDivElement;
        let chat_spacer = document.getElementById("chat_spacer") as HTMLDivElement;

        let updateValue = () => {
            this.current_text = this.getInputMessage();
            if (this.current_text) this.hideLabelContent();
            this.cacheCurrentMessage();
            chat_spacer.style.paddingTop = (45 + input_box.clientHeight) + "px";
        };

        /* small timeout to get the already changed text */
        let delayedUpdate = () => { window.setTimeout(updateValue, 100); };

        /* to allow paste only plain text */
        /* addListener(input, "paste", (event) => setInterval(() => {
            this.current_text = this.cleanInputText();
            this.updateInputMessage();
            console.log("on paste");
            event.stopPropagation();
            event.preventDefault();
        }, 0)); */

        /* listen for every event which is fired after text is changed */
        addListener(input, "change",  delayedUpdate);
        addListener(input, "cut",     delayedUpdate);
        // addListener(input, "paste",   delayedUpdate);
        addListener(input, "drop",    delayedUpdate);
        addListener(input, "keydown", delayedUpdate);

        /* need to set value immidiately before initial resizing */
        this.updateInputMessage();
        updateValue();
    }

    cacheCurrentMessage() {
        let key = "cached_message_" + this.conversation_id + this.is_chat;
        let value = {};
        value[key] = this.current_text;
        this.chromeapi.PostPortMessage({
            name: "current_message",
            data: value
        });
    }

    clearCache() {
        let key = "cached_message_" + this.conversation_id + this.is_chat;
        chrome.storage.sync.remove(key);
        this.current_text = "";
        this.cacheCurrentMessage();
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
                console.log("marked as read");
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

    errorHandler(error) {
        console.error("An error occurred", error);
        // return Promise.reject(error.message || error);
    }

    toggleEmoji() {
        let emoji_wrapper = document.getElementById("emoji_control") as HTMLDivElement;
        if (emoji_wrapper.clientHeight && emoji_wrapper.clientHeight > 20) {
            this.collapseEmoji(emoji_wrapper);
        }
        else {
            emoji_wrapper.style.height = "210px";
            emoji_wrapper.style.visibility = "visible";
            emoji_wrapper.style.display = "block";
            emoji_wrapper.onmouseenter = () => this.onEmojiMouseEnter();
        }
    }

    onEmojiMouseEnter() {
        console.log("onmouseenter");
        let emoji_wrapper = document.getElementById("emoji_control") as HTMLDivElement;
        emoji_wrapper.onmouseenter = null;
        setTimeout(() => emoji_wrapper.onmouseleave = () => this.collapseEmoji(emoji_wrapper), 300);
    }

    collapseEmoji(emoji_wrapper: HTMLDivElement) {
        emoji_wrapper.style.height = "0";
        emoji_wrapper.onmouseleave = null;
        setTimeout(() => {
            emoji_wrapper.style.visibility = "hidden";
            emoji_wrapper.style.display = "none";
        }, 300);
    }

    onEmojiSelect(emoji: string) {
        this.hideLabelContent();
        this.cacheCurrentMessage();
        this.current_text += emoji;
        this.updateInputMessage();
    }

    getInputMessage() {
        let div = document.getElementById("message_input");
        let html = div.innerHTML;
        let matches = html.match(/(<div.*?>)?<img.*?>(<\/div>)?/g);
        let altreg = new RegExp("alt=\"(.*?)\"");
        if (!matches) return div.innerText.trim();
        for (let m of matches) {
            let emoji = altreg.exec(m)[1];
            html = html.replace(m, emoji);
        }
        return html.trim();
    }

    updateInputMessage() {
        let div = document.getElementById("message_input");
        div.innerHTML = twemoji.parse(this.current_text);
    }

    cleanInputText() {
        let text = this.getInputMessage();
        let div = document.createElement("div");
        div.innerHTML = text;
        return div.innerText;
    }
}