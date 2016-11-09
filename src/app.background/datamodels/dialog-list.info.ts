import { DialogInfo } from "./dialog.info";

export class DialogListInfo {
    dialogs: DialogInfo[];
    count: number;
    unread: number;

    constructor() {
        this.dialogs = [];
        this.count = 0;
        this.unread = 0;
    }
}