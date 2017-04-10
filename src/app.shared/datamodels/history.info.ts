import { SingleMessageInfo } from './single-message.info';

export interface HistoryInfo {
    count: number;
    peerId: number;
    conversationTitle: string;
    isChat: boolean;
    messages: SingleMessageInfo[];
}
