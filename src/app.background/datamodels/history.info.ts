import { SingleMessageInfo } from "./single-message.info";

export class HistoryInfo {
    count: number;
    conversationId: number;
    conversationTitle: string;
    isChat: boolean;
    messages: SingleMessageInfo[];
}