import { UserInfo } from './user.info';

export interface ChatInfo {
    users: UserInfo[];
    adminId: number;
    id: number;
    title: string;
    type: string;
}
