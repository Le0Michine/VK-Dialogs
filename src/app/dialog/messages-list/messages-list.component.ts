import { Component, Input } from "@angular/core";
import "rxjs/add/observable/combineLatest";

import { MessageViewModel, SingleMessageInfo, UserInfo, HistoryInfo } from "../../datamodels";

@Component({
    selector: "messages-list",
    templateUrl: "messages-list.component.html",
    styleUrls: [
        "messages-list.component.css",
        "../../css/color-scheme.css"
    ]
})
export class MessagesListComponent {
    @Input() historyToShow: any[];
    @Input() isForwarded: boolean;
}