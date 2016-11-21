import { Pipe } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { TranslateService } from "../translate";

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
        } else if (attachment.geo) {
            // http://maps.google.com/?ie=UTF8&hq=&ll=35.028028+-106.536655&z=13&q=35.028028+-106.536655
            // image https://maps.googleapis.com/maps/api/staticmap?zoom=13&size=600x300&maptype=roadmap&markers=color:blue%7Clabel:S%7C40.702147,-74.015794
            let ll = attachment.geo.coordinates.split(" ").join(",");
            return `http://maps.google.com/?ie=UTF8&hq=&ll=${ll}&z=13&q=${ll}`;
        }
        else {
            return "";
        }
    }
}

 /*
    geo: {
        coordinates: "1.0245284569241E-5 3.415095195673E-6",
        place:{
            city: "Barselona"
            country: "Spain"
            title:"Barselona, Spain"
        },
        type: "point"
    }
     */

@Pipe({
    name: "attachment_title"
})
export class MessageAttachmentTitlePipe {
    transform(attachment) {
        let tmp = attachment.doc || attachment.audio || attachment.video || attachment.wall || attachment.link || attachment.geo;
        if (attachment.doc || attachment.audio || attachment.video || attachment.link) {
            return tmp.title;
        }
        else if (attachment.wall) {
            return tmp.text;
        }
        else if (attachment.geo) {
            return tmp.place.title;
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
        if (atttachment.geo) return "att_doc_img";
        return "att_doc_img";
    }
}