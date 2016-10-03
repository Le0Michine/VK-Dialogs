import { Pipe } from "@angular/core";

@Pipe({ name: "linkToUser" })
export class LinkToUserPipe {
    transform(uid: number) {
        return "https://vk.com/id" + uid;
    }
}