import { OneSenderMessagesGroup } from './one-sender-messages-group.info';

export interface OneDayMessagesGroup {
    messages: OneSenderMessagesGroup[];
    date: number;
    groupId: number;
}
