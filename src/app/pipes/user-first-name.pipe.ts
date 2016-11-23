import { Pipe } from "@angular/core";

import { UserInfo } from "../datamodels";

@Pipe({ name: "userFirstName" })
export class UserFirstNamePipe {
    transform(user: UserInfo) {
        return user && user.firstName ? user.firstName : "loading...";
    }
}