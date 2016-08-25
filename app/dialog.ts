import { Message } from './message';

export class Dialog {
    message: Message;
    in_read: number;
    out_read: number;
    unread: number;
}

export class DialogToShow {
    message: Message;
    unread: number;
    photos: string[] = ['http://vk.com/images/camera_c.gif'];
    title: string = 'loading...';
    date_format: string = 'MMM d y';
    sender: string;
    attachment_only: boolean = false;
    attachment_type: string = '';
    online: boolean = false;
}