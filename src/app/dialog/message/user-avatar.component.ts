import { Component, Input } from "@angular/core";

import { UserInfo } from "../../datamodels";

@Component({
    selector: "user-avatar",
    templateUrl: "user-avatar.component.html",
    styleUrls: [
        "user-avatar.component.css"
    ]
})
export class UserAvatarComponent {
    @Input() user: UserInfo;
}