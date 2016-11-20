import { InputMessageInfo } from "./input-message.info";

export class InputMessageListInfo {
    conversationIds: number[];
    messages: { [id: number]: InputMessageInfo };

    constructor() {
        this.conversationIds = [];
        this.messages = {};
    }
}