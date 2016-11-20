import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ElementRef, Renderer, Input, Output, EventEmitter } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Subscription } from "rxjs/Subscription";
import { Store } from "@ngrx/store";

import { DialogService } from "../services";
import { MenuItem, InputMessageState } from "../datamodels";
import { AppState } from "../app.store";
import { twemoji } from "../../../lib/twemoji";

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
        this.cacheCurrentMessage();
    }

    addAttachment(value: MenuItem) {
        if (value.id) {
            console.log("new attachment", value);
            this.attachments.push(value);
            this.cacheCurrentMessage();
        }
    }

    get inputText(): string {
        return this._inputText;
    }

    set inputText(value: string) {
        this._inputText = value;
        if (this._inputText && this._inputText.trim()) {
            this.inputLabelVisible = false;
        }
        else {
            this.inputLabelVisible = true;
        }
    }

    constructor (
        private store: Store<AppState>,
        private messagesService: DialogService,
        private changeDetector: ChangeDetectorRef,
        private renderer: Renderer
    ) { }

    ngOnInit() {
        this.subscriptions.push(this.store.select(s => s.inputMessages)
            .map(x => x.messages[this.conversationId])
            .filter(x => Boolean(x))
            .subscribe(m => {
                this.sendingBlocked = m.state === InputMessageState.SENDING;
            })
        );
    }

    ngAfterViewInit() {
        this.setFocusOnInput();
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
                this.cacheCurrentMessage();
            }
        });
    }

    ngOnDestroy() {
        console.log("messages-input on destroy");
        this.cacheCurrentMessage();
        for (let s of this.subscriptions) {
            s.unsubscribe();
        }
    }

    setFocusOnInput() {
        this.renderer.invokeElementMethod(this.input.nativeElement, "focus");
    }

    onInput(event: Event): void {
        this.removeStyle(event.srcElement.childNodes);
        this.inputText = this.getText(event.srcElement.childNodes);
        this.cacheCurrentMessage();
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
        this.inputText += emoji;
        this.updateInputMessage();
        this.setFocusOnInput();
        this.cacheCurrentMessage();
    }

    restoreCachedMessages(id, isChat) {
        this.store.select(s => s.inputMessages)
            .map(im => im.messages[this.conversationId])
            .first()
            .subscribe(message => {
                if (message) {
                    console.log("restored message", message, message.body, message.attachments);
                    this.inputText = message.body;
                    this._attachments = message.attachments || [];
                    this.updateInputMessage();
                }
            });
    }

    cacheCurrentMessage() {
        this.messagesService.typeMessage(this.conversationId, { body: this.inputText, attachments: this.attachments }, this.isChat);
    }

    clearCache() {
        this.inputText = "";
        this.attachments = [];
        this.updateInputMessage();
    }

    sendMessage(text: string) {
        if (this.sendingBlocked) {
            console.warn("message is sending");
            return;
        }
        if (!text && !this.attachments.length) {
            console.log("message text is empty, nothing to send");
            return;
        }

        this.onMessageSent.emit(false);
        this.sendingBlocked = true;

        text = this.escape(text);

        this.messagesService.sendMessage(this.conversationId, { body: text, attachments: this.attachments }, this.isChat);

        this.store.select(s => s.inputMessages)
            .map(x => x.messages[this.conversationId])
            .filter(x => Boolean(x) && x.state === InputMessageState.SENT || x.state === InputMessageState.FAIL)
            .first()
            .subscribe(m => {
                this.onMessageSent.emit(m.state === InputMessageState.SENT);
                if (m.state === InputMessageState.SENT) {
                    this.clearCache();
                }
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