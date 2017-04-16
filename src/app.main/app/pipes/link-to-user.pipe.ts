import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'linkToUser' })
export class LinkToUserPipe implements PipeTransform {
    transform(uid: number) {
        return 'https://vk.com/id' + uid;
    }
}
