import { Pipe } from "@angular/core";

import { UserInfo } from "../datamodels";

@Pipe({ name: "userAvatar" })
export class UserAvatarPipe {
    transform(user: UserInfo) {
        return user && user.photo50 ? user.photo50 : "https://vk.com/images/camera_c.gif";
    }
}