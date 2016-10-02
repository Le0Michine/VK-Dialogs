export class SingleMessageInfo {
    id: number;
    conversationId: number;
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
    attachments: any;
    photo50: string;
}