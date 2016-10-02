import { UserInfo } from "./user.info";

export class ChatInfo {
    users: UserInfo[];
    adminId: number;
    id: number;
    title: string;
    type: string;
}