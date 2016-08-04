import { Message } from './message'

export class Dialog {
    messages: Message[];
    unread: number;
}

export class Chat extends Dialog {
    chat_id: number;
    users_count: number;
    admin_id: number;
}