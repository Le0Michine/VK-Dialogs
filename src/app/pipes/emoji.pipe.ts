import { Pipe } from "@angular/core";
import { twemoji } from "../../../lib/twemoji";

@Pipe({ name: "emoji" })
export class EmojiPipe {
    transform(text) {
        return twemoji.parse(text);
    }
}