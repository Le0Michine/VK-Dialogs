import { Component, Input } from "@angular/core";

@Component({
    selector: "forwarded-messages",
    templateUrl: "forwarded-messages.component.html",
    styleUrls: [
        "forwarded-messages.component.css"
    ]
})
export class ForwardedMessagesComponent {
    @Input() messages: any;
}