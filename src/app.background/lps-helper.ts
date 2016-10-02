import { VKConsts } from "../app/vk-consts";
import { SingleMessageInfo } from "./datamodels/datamodels";

export class LPSHelper {

    /* [4,$message_id,$flags,$from_id,$timestamp,$subject,$text,$attachments] -- add a new message */
    public static processMessage(update: any): SingleMessageInfo {
        let message_id = update[1];
        let flags = update[2];
        let from_id = update[3];
        let timestamp = update[4];
        let subject = update[5];
        let text = update[6];
        let attachments = update[7];

        let is_chat = (flags & message_flags.CHAT) !== message_flags.CHAT;
        let read_state = (flags & message_flags.UNREAD) !== message_flags.UNREAD;
        let out = (flags & message_flags.OUTBOX) === message_flags.OUTBOX;

        let message = new SingleMessageInfo();

        message.conversationId = from_id;
        message.isRead = read_state;
        message.out = out;
        message.title = subject;
        message.body = text;
        message.userId = attachments.from || from_id;
        message.id = message_id;
        message.date = timestamp;
        return message;
    }
}

const enum message_flags {
    UNREAD = 1, OUTBOX = 2, REPLIED = 4, IMPORTANT = 8, CHAT = 16, FRIENDS = 32, SPAM = 64, DELЕTЕD = 128, FIXED = 256, MEDIA = 512
};