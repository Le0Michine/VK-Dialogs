import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatDate'
})
export class FormatDatePipe implements PipeTransform {
    transform(unixtime: number) {
        const date = new Date(unixtime * 1000);
        const now = new Date();

        if (date.getDate() === now.getDate()
            && date.getMonth() === now.getMonth()
            && date.getFullYear() === now.getFullYear()) {
                return 'jm';
        } else if (date.getDate() === now.getDate() - 1
            && date.getMonth() === now.getMonth()
            && date.getFullYear() === now.getFullYear()) {
                return 'EEEE';
        } else if (date.getFullYear() === now.getFullYear()) {
            return 'MMM d';
        }
        return 'MMM d y';
    }
}
