import { InputMessageState } from "./input-message-state.enum";

export class InputMessageInfo {
    conversationId: number;
    chatId: number;
    body: string;
    attachments: any;
    state: InputMessageState;
}