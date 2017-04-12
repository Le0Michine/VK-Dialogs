import { SingleMessageInfo } from './single-message.info';

export interface OneSenderMessagesGroup {
    messages: SingleMessageInfo[];
    fromId: number;
    date: number;
    groupId: number;
}
