import { Component, Input } from "@angular/core";

@Component({
    selector: "message-body",
    templateUrl: "message-body.component.html",
    styleUrls: [
        "message-body.component.css",
        "../../css/font-style.css"
    ]
})
export class MessageBodyComponent {
    @Input() body: string;
}