import { UserInfo, SingleMessageInfo } from "./datamodels";

export class MessageViewModel {
    from: UserInfo;
    messages: SingleMessageInfo[] = [];
    date: number;
    isUnread: boolean; 
}