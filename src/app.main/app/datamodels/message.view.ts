import { UserInfo, SingleMessageInfo } from './';

export interface MessageViewModel {
    from: UserInfo;
    fromId: number;
    messages: SingleMessageInfo[];
    date: number;
    isRead: boolean;
}

export interface OneDayMessagesGroup {
    messages: OneSenderMessagesGroup[];
    date: number;
}

export interface ReadStateMessagesGroup {
    messages: OneSenderMessagesGroup[];
    isRead: boolean;
}

export interface OneSenderMessagesGroup {
    messages: MessageViewModel[];
    fromId: number;
}
