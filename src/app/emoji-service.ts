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

    private emoticons_start = "1F601";
    private emoticons_end = "1F64F";
    private add_emoticons_start = "1F600";
    private add_emoticons_end = "1F636";
    private transport_map_start = "1F680";
    private transport_map_end = "1F6C0";
    private dingbats_start = "2702";
    private dingbats_end = "27B0";
    private enclosed_chars_start = "24C2";
    private enclosed_chars_end = "1F251";

    private emoji_dec_codes = [];

    private template = "<div style=\"font-size: 35px; color: #428bca; display: inline-block; margin-left: 2px; font-family: -apple-system EmojiOneColor\">{{emoji}}</div>";

    constructor() {
        /** Emoticons */
        this.addEmojiRange(this.emoticons_start, this.emoticons_end);

        /** Additional emoticons */
        this.addEmojiRange(this.add_emoticons_start, this.add_emoticons_end);

        /** Transport and map symbols */
        this.addEmojiRange(this.transport_map_start, this.transport_map_end);

        /** Dingbats */
        this.addEmojiRange(this.dingbats_start, this.dingbats_end);

        /** Enclosed characters */
        // this.addEmojiRange(this.enclosed_chars_start, this.enclosed_chars_end);
    }

    getEmojiChars() {
        return this.emoji_dec_codes;
    }

    wrapEmoji(emoji) {
        return this.template.replace("{{emoji}}", emoji);
    }

    private addEmojiRange(start_hex: string, end_hex: string) {
        let start_dec = parseInt(start_hex, 16);
        let end_dec = parseInt(end_hex, 16);

        for (let i = start_dec; i <= end_dec; i++) {
            this.emoji_dec_codes.push("&#" + i);
        }
    }
}