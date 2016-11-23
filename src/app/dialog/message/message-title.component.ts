import { Component, Input } from "@angular/core";

import { UserInfo } from "../../datamodels";

@Component({
    selector: "message-title",
    templateUrl: "message-title.component.html",
    styleUrls: [
        "message-title.component.css"
    ]
})
export class MessageTitleComponent {
    @Input() user: UserInfo;
    @Input() date: number;
    @Input() dateOnNewLine: boolean;
}