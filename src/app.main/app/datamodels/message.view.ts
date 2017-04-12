import { UserInfo, SingleMessageInfo } from './';

export interface MessageViewModel {
    fromId: number;
    messages: SingleMessageInfo[];
    date: number;
    isRead: boolean;
}
