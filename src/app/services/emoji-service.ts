import { Injectable } from "@angular/core";

@Injectable()
export class EmojiService {
    /**
     * Emoticons ( 1F601 - 1F64F )
     * Dingbats ( 2702 - 27B0 )
     * Transport and map symbols ( 1F680 - 1F6C0 )
     * Enclosed characters ( 24C2 - 1F251 )
     * Uncategorized ( 0080 - 1F5FF )
     * Additional emoticons ( 1F600 - 1F636 )
     * Additional transport and map symbols ( 1F681 - 1F6C5 )
     * Other additional symbols ( 1F30D - 1F567 )
     */

    private emoticonsStart = "1F601";
    private emoticonsEnd = "1F64F";
    private addEmoticonsStart = "1F600";
    private addEmoticonsEnd = "1F636";
    private transportMapStart = "1F680";
    private transportMapEnd = "1F6C0";
    private addTransportMapStart = "1F681";
    private addTransportMapEnd = "1F6C5";
    private dingbatsStart = "2702";
    private dingbatsEnd = "27B0";
    private enclosedCharsStart = "24C2";
    private enclosedCharsEnd = "1F251";

    private emojiDecCodes = [];

    private template = "<div style=\"font-size: 35px; color: #428bca; display: inline-block; margin-left: 2px; font-family: -apple-system EmojiOneColor\">{{emoji}}</div>";

    constructor() {
        /** Emoticons */
        this.addEmojiRange(this.emoticonsStart, this.emoticonsEnd);

        /** Additional emoticons */
        this.addEmojiRange(this.addEmoticonsStart, this.addEmoticonsEnd);

        /** Transport and map symbols */
        this.addEmojiRange(this.transportMapStart, this.transportMapEnd);

        /** Additional transport and map symbols */
        this.addEmojiRange(this.addTransportMapStart, this.addTransportMapEnd);

        /** Dingbats */
        this.addEmojiRange(this.dingbatsStart, this.dingbatsEnd);

        /** Enclosed characters */
        this.addEmojiRange(this.enclosedCharsStart, this.enclosedCharsEnd);
    }

    getEmojiChars() {
        return this.emojiDecCodes;
    }

    wrapEmoji(emoji) {
        return this.template.replace("{{emoji}}", emoji);
    }

    private addEmojiRange(startHex: string, endHex: string) {
        let startDec = parseInt(startHex, 16);
        let endDec = parseInt(endHex, 16);

        for (let i = startDec; i <= endDec; i++) {
            let emoji = twemoji.convert.fromCodePoint(i.toString(16));
            if (twemoji.parse(emoji) === emoji) continue; /** if emoji isn't supported by twemoji */
            this.emojiDecCodes.push(emoji);
        }
    }
}