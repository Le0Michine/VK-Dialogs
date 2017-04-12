import { MessageAttachment } from './message-attachments';

export interface SingleMessageInfo {
    id: number;
    randomId: number;
    peerId: number;
    userId: number;
    chatId: number;
    date: number;
    isRead: boolean;
    fromId: number;
    out: boolean;
    body: string;
    action: string;
    actionMid: number;
    title: string;
    fwdMessages: SingleMessageInfo[];
    attachments: MessageAttachment[];
    photo50: string;
    clear?: boolean;
}
