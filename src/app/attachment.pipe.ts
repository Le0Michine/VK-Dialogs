///<reference path="../twemoji.d.ts"/>
import { Pipe } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { TranslateService } from "ng2-translate/ng2-translate";

@Pipe({
    name: "attachment_size"
})
export class MessageAttachmentSubTitlePipe {
    constructor(private translate: TranslateService) { }

    transform(attachment) {
        let tmp = attachment.doc || attachment.audio || attachment.video || attachment.wall || attachment.link || {size: -1};
        if (attachment.doc) {
            return Math.floor(tmp.size / 1000) + " KB";
        }
        else if (attachment.wall) {
            return this.translate.instant("attachment.wall");
        }
        else if (attachment.link) {
            return tmp.caption;
        }
        else if (attachment.video || attachment.audio) {
            let min = Math.floor(tmp.duration / 60);
            let sec = tmp.duration % 60;
            return min + ":" + (sec < 10 ? "0" + sec : sec);
        }
        else {
            return "";
        }
    }
}

@Pipe({
    name: "attachment_url"
})
export class MessageAttachmentUrlPipe {
    transform(attachment, uid) {
        let tmp = attachment.doc || attachment.audio || attachment.video || attachment.wall || attachment.link;
        if (attachment.doc || attachment.audio || attachment.link) {
            return tmp.url;
        }
        else if (attachment.wall) {
            return "https://vk.com/im?sel=" + uid + "&w=wall" + tmp.to_id + "_" + tmp.id;
        }
        else if (attachment.video) {
            return "https://vk.com/im?sel=" + uid + "&z=video" + tmp.owner_id + "_" + tmp.id + "%" + tmp.access_key;
        }
        else {
            return "";
        }
    }
}

@Pipe({
    name: "attachment_title"
})
export class MessageAttachmentTitlePipe {
    transform(attachment) {
        let tmp = attachment.doc || attachment.audio || attachment.video || attachment.wall || attachment.link;
        if (attachment.doc || attachment.audio || attachment.video || attachment.link) {
            return tmp.title;
        }
        else if (attachment.wall) {
            return tmp.text;
        }
        else {
            return "";
        }
    }
}

@Pipe({
    name: "attachment_icon"
})
export class MessageAttachmentIconPipe {
    transform(atttachment) {
        if (atttachment.video) return "att_vid_img";
        if (atttachment.doc && atttachment.doc.ext === "zip") return "att_zip_img";
        if (atttachment.doc || atttachment.wall) return "att_doc_img";
        if (atttachment.audio) return "att_aud_img";
        return "att_doc_img";
    }
}

@Pipe({
    name: "chat_action",
    pure: false
})
export class ChatActionPipe {
    transform(message) {
        switch (message.action) {
            case "chat_kick_user":
                if (message.action_mid !== message.user_id) {
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

@Pipe({ name: "safe" })
export class SafePipe {
    constructor(private sanitizer: DomSanitizer) { }

    transform(html) {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}

@Pipe({ name: "cut_links" })
export class CutLinksPipe {
    transform(text) {
        let len = 55;
        let urls = text.match(/(?:(?:https?|ftp|file|chrome):\/\/|www\.|ftp\.)(?:\([-A-ZА-Яа-я\w0-9+&@#\/%=~_|$?!:,.]*\)|[-A-ZА-Яа-я\w0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-ZА-Яа-я\w0-9+&@#\/%=~_|$?!:,.]*\)|[A-ZА-Яа-я\w0-9+&@#\/%=~_|$])/igm);
        if (!urls) return text;
        for (let url of urls) {
            text = text.replace(url,
                "<a target=\"_blank\" href=\"" + url + "\" title=\"" + url + "\" style=\"cursor:pointer;\">" + (url.length > len ? (url.slice(0, len) + "..") : url) + "</a>");
        }
        return text;
    }
}

@Pipe({ name: "emoji" })
export class EmojiPipe {
    transform(text) {
        return twemoji.parse(text);
    }
}