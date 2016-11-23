import { Component, Input } from "@angular/core";

@Component({
    selector: "messages-attachment",
    templateUrl: "attachment.component.html",
    styleUrls: [
        "attachment.component.css",
        "../../css/color-scheme.css"
    ]
})
export class AttachmentComponent {
    @Input() attachment: any;
    @Input() isRead: any;
}