import { Pipe } from "@angular/core";

@Pipe({ name: "cutLinks" })
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