import { Pipe, PipeTransform } from '@angular/core';
import { twemoji } from '../../../lib/twemoji';

@Pipe({ name: 'emoji' })
export class EmojiPipe implements PipeTransform {
    transform(text) {
        return twemoji.parse(text, null);
    }
}
