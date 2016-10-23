///<reference path="../../../lib/twemoji.d.ts"/>
import { Pipe } from "@angular/core";

@Pipe({ name: "emoji" })
export class EmojiPipe {
    transform(text) {
        return twemoji.parse(text);
    }
}