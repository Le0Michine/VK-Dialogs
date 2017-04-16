import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'cutLinks' })
export class CutLinksPipe implements PipeTransform {
    transform(text: string, white: boolean = false) {
        const len = 55;
        // tslint:disable-next-line:max-line-length
        const urls = text.match(/(?:(?:https?|ftp|file|chrome):\/\/|www\.|ftp\.)(?:\([-A-ZА-Яа-я\w0-9+&@#\/%=~_|$?!:,.]*\)|[-A-ZА-Яа-я\w0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-ZА-Яа-я\w0-9+&@#\/%=~_|$?!:,.]*\)|[A-ZА-Яа-я\w0-9+&@#\/%=~_|$])/igm);
        if (!urls) {
            return text;
        }
        for (const url of urls) {
            text = text.replace(url,
                // tslint:disable-next-line:max-line-length
                `<a target="_blank" class="${white ? 'white-text' : ''}" href="${url}"title="${url}" style="cursor:pointer;">${(url.length > len ? (url.slice(0, len) + '..') : url)}</a>`);
        }
        return text;
    }
}
