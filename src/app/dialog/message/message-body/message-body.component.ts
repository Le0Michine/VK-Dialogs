import { Component, Input } from "@angular/core";

@Component({
    selector: "message-body",
    templateUrl: "message-body.component.html",
    styleUrls: [
        "message-body.component.css"
    ]
})
export class MessageBodyComponent {
    @Input() body: string;
}