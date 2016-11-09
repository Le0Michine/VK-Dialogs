import { UserInfo } from "./user.info";

export class UserListInfo {
    userIds: number[];
    users: { [id: number]: UserInfo };

    constructor() {
        this.users = {};
        this.userIds = [];
    }
}