import { HistoryInfo } from "./history.info";

export class HistoryListInfo {
    conversationIds: number[];
    history: { [id: number]: HistoryInfo };

    constructor() {
        this.history = {};
        this.conversationIds = [];
    }
}