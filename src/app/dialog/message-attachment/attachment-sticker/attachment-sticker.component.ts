import { Component, Input } from "@angular/core";

@Component({
    selector: "messages-attachment-sticker",
    templateUrl: "attachment-sticker.component.html",
    styleUrls: [
        "attachment-sticker.component.css"
    ]
})
export class AttachmentStickerComponent {
    @Input() sticker: any;
}