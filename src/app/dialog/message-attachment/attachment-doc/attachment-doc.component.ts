import { Component, Input } from "@angular/core";

@Component({
    selector: "messages-attachment-doc",
    templateUrl: "attachment-doc.component.html",
    styleUrls: [
        "attachment-doc.component.css",
        "../../../css/color-scheme.css"
    ]
})
export class AttachmentDocComponent {
    @Input() doc: any;
    @Input() isRead: any;
}