import { InputMessageState } from './input-message-state.enum';

export interface InputMessageInfo {
    peerId: number;
    body: string;
    attachments: any;
    state: InputMessageState;
}
