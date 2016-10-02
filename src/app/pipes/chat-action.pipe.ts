import { Pipe } from "@angular/core";

import { SingleMessageInfo } from "../datamodels/datamodels";

@Pipe({
    name: "chatAction",
    pure: false
})
export class ChatActionPipe {
    transform(message: SingleMessageInfo): string {
        switch (message.action) {
            case "chat_kick_user":
                if (message.actionMid !== message.userId) {
                    return "actions.chat_kick_user2";
                }
                else {
                    return "actions.chat_kick_user";
                }
            case "chat_photo_remove":
                return "actions.chat_photo_remove";
            case "chat_photo_update":
                return "actions.chat_photo_update";
            case "chat_create":
                return "actions.chat_create";
            case "chat_invite_user":
                return "actions.chat_invite_user";
        }
    }
}