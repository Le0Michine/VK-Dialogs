import { Message } from './message';

export class Dialog {
    message: Message;
    in_read: number;
    out_read: number;
    unread: number;
}