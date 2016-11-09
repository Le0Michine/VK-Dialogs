import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ElementRef, Renderer, Input, Output, EventEmitter } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import { DialogService, UserService, VKService, ChromeAPIService } from "../services";
import { MenuItem } from "../datamodels";

@Component({
    selector: "message-input",
    templateUrl: "message-input.component.html",
    styleUrls: [
        "message-input.component.css",
        "../css/round-buttons.css",
        "../css/font-style.css",
        "../css/color-scheme.css"
    ]
})
export class MessageInputComponent {
    @ViewChild("minput") input: ElementRef;

    @Input() conversationId: number;
    @Input() isChat: boolean;
    @Input() selectEmoji: Observable<string>;
    @Input() onSendMessageClick: Observable<string>;
    @Input() attachmentUploaded: Observable<boolean>;
    @Input() newAttachment: Observable<MenuItem>;
    @Input() removeAttachment: Observable<string>;

    @Output() onMessageSent: EventEmitter<boolean> = new EventEmitter();
    @Output() onAttachmentsUpdate: EventEmitter<MenuItem[]> = new EventEmitter();
    @Output() onUserInput: EventEmitter<string> = new EventEmitter();

    sendingBlocked: boolean = false;
    inputLabelVisible: boolean = true;

    subscriptions: Subscription[] = [];

    private _inputText: string = "";
    private _attachments: MenuItem[] = [];

    get attachments(): MenuItem[] {
        return this._attachments;
    }

    set attachments(value: MenuItem[]) {
        this._attachments = value;
        this.onAttachmentsUpdate.emit(this._attachments);
        this.cacheCurrentMessage();
    }

    getAttachment(): string {
        return this.attachments.map(x => x.id).join();
    }

    addAttachment(value: MenuItem) {
        if (value.id) {
            console.log("new attachment", value);
            this.attachments.push(value);
            this.onAttachmentsUpdate.emit(this.attachments);
            this.cacheCurrentMessage();
        }
    }

    get inputText(): string {
        return this._inputText;
    }

    set inputText(value: string) {
        this._inputText = value;
        this.cacheCurrentMessage();
        if (this._inputText && this._inputText.trim()) {
            this.inputLabelVisible = false;
        }
        else {
            this.inputLabelVisible = true;
        }
    }

    constructor (
        private messagesService: DialogService,
        private vkservice: VKService,
        private userService: UserService,
        private changeDetector: ChangeDetectorRef,
        private chromeapi: ChromeAPIService,
        private renderer: Renderer) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.renderer.invokeElementMethod(this.input.nativeElement, "focus");
        this.subscriptions.push(this.selectEmoji.subscribe(emoji => this.onEmojiSelect(emoji)));
        this.subscriptions.push(this.onSendMessageClick.subscribe(() => this.sendMessage(this.inputText)));
        this.subscriptions.push(this.attachmentUploaded.subscribe(value => this.sendingBlocked = !value));
        this.restoreCachedMessages(this.conversationId, this.isChat);
        this.newAttachment.subscribe(value => this.addAttachment(value));
        this.removeAttachment.subscribe(value => {
            console.log("remove attachment", value);
            let i = this.attachments.findIndex(x => x.id === value);
            if (i > -1) {
                this.attachments.splice(i, 1);
                this.onAttachmentsUpdate.emit(this.attachments);
                this.cacheCurrentMessage();
            }
        });
    }

    ngOnChanges() {
    }

    ngOnDestroy() {
        this.cacheCurrentMessage(true);
        for (let s of this.subscriptions) {
            s.unsubscribe();
        }
    }

    onInput(event: Event): void {
        this.removeStyle(event.srcElement.childNodes);
        this.inputText = this.getText(event.srcElement.childNodes);
        this.onUserInput.emit(this.inputText);
    }

    showLabelContent() {
        if (!this.inputText || !this.inputText.trim()) {
            this.inputLabelVisible = true;
        }
    }

    removeStyle(nodes: NodeList) {
        if (!nodes || !nodes.length) return;
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (node.nodeType !== node.ELEMENT_NODE) {
                return;
            }
            let attributes = node.attributes;
            if (attributes) {
                if (node.nodeName === "IMG" && attributes.getNamedItem("class").value === "emoji") {
                    return;
                }
                while (attributes.length) {
                    attributes.removeNamedItem(attributes[0].name);
                }
                let classAtr = document.createAttribute("class");
                classAtr.value = "styleless";
                attributes.setNamedItem(classAtr);
            }
            this.removeStyle(node.childNodes);
        }
    }

    getText(nodes: NodeList): string {
        if (!nodes || !nodes.length) return "";
        let text = "";
        for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            if (node.nodeType === node.TEXT_NODE) {
                text += (node as Text).data;
            }
            else if (node.nodeName === "BR") {
                text += "\n";
            }
            else if (node.nodeName === "IMG" && node.attributes && node.attributes.getNamedItem("class").value === "emoji") {
                text += node.attributes.getNamedItem("alt").value;
            }
            else if (node["innerText"]) {
                text += node["innerText"];
            }
            else {
                text += this.getText(node.childNodes);
            }
        }
        return text;
    }

    onEmojiSelect(emoji: string) {
        this.cacheCurrentMessage();
        this.inputText += emoji;
        this.updateInputMessage();
    }

    restoreCachedMessages(id, isChat) {
        console.log("restore message");
        let key = "cached_message_" + id + isChat;
        let value = {};
        value[key] = "";

        this.chromeapi.SendRequest({
            "name": "get_current_message",
            "key": key
        }).subscribe((response) => {
            let message = response[key];
            if (message) {
                console.log("restored message", message, message.text, message.attachments);
                this.inputText = message.text as string;
                this.attachments = message.attachments || [];
                this.updateInputMessage();
            }
        });
    }

    cacheCurrentMessage(last: boolean = false) {
        let key = "cached_message_" + this.conversationId + this.isChat;
        this.chromeapi.PostPortMessage({
            name: "current_message",
            key: key,
            text: this.inputText,
            attachments: this.attachments,
            is_last: last
        });
    }

    clearCache() {
        this.inputText = "";
        this.attachments = [];
        this.cacheCurrentMessage(true);
        this.updateInputMessage();
    }

    sendMessage(text: string) {
        if (this.sendingBlocked) {
            console.warn("message is sending");
            return;
        }
        if (!text && !this.getAttachment()) {
            console.log("message text is empty, nothing to send");
            return;
        }

        this.onMessageSent.emit(false);
        this.sendingBlocked = true;

        text = this.escape(text);

        this.messagesService.sendMessage(this.conversationId, { body: text, attachments: this.getAttachment()}, this.isChat)
            .subscribe(
                message => {
                    this.sendingBlocked = false;
                    this.onMessageSent.emit(true);
                    this.clearCache();
                    console.log("result: ", message);
                },
                error => {
                    this.errorHandler(error);
                    this.sendingBlocked = false;
                    this.onMessageSent.emit(true);
                },
                () => {
                    console.log("message sent");
                    this.clearCache();
                    this.sendingBlocked = false;
                    this.onMessageSent.emit(true);
            });
    }

    onKeyPress(event, div: HTMLDivElement) {
        if (event.keyCode === 13 && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage(this.inputText);
        }
    }

    updateInputMessage() {
        this.renderer.setElementProperty(this.input.nativeElement, "innerHTML", twemoji.parse(this.inputText));
        this.changeDetector.detectChanges();
    }

    errorHandler(error) {
        console.error("An error occurred", error);
    }

    escape(text) {
        return encodeURI(text.trim());
    }
}