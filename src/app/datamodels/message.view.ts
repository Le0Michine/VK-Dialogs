import { UserInfo, SingleMessageInfo } from "./datamodels";

export class MessageViewModel {
    from: UserInfo;
    fromId: number;
    messages: SingleMessageInfo[] = [];
    date: number;
    isUnread: boolean;
}