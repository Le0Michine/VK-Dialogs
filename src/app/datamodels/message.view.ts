import { UserInfo, SingleMessageInfo } from "./";

export class MessageViewModel {
    from: UserInfo;
    fromId: number;
    messages: SingleMessageInfo[] = [];
    date: number;
    isRead: boolean;
}