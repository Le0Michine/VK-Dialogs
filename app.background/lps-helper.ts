import { VKConsts } from '../app/vk-consts';
import { Message, Chat } from '../app/message';
import { Dialog } from '../app/dialog';
import { User } from '../app/user';

export class LPSHelper {

    /* [4,$message_id,$flags,$from_id,$timestamp,$subject,$text,$attachments] -- add a new message */
    public static processMessage(update: any) {
        let message_id = update[1];
        let flags = update[2];
        let from_id = update[3];
        let timestamp = update[4];
        let subject = update[5];
        let text = update[6];
        let attachments = update[7];

        let is_chat = (flags & message_flags.CHAT) == message_flags.CHAT;
        let read_state = (flags & message_flags.UNREAD) == message_flags.UNREAD;
        let out = (flags & message_flags.OUTBOX) == message_flags.OUTBOX;

        if (is_chat) {
            let m = new Chat();
            m.chat_id = from_id;
            m.read_state = read_state;
            m.out = out;
            m.title = subject;
            m.body = text;
            m.user_id = attachments['from'];
            m.id = message_id;
            m.date = timestamp;
            return m;
        }
        else {
            let m = new Message();
            m.user_id = from_id;
            m.read_state = read_state;
            m.out = out;
            m.title = subject;
            m.body = text;
            m.id = message_id;
            m.date = timestamp;
            return m;
        }
    }
}

const enum message_flags {
    UNREAD = 1, OUTBOX = 2, REPLIED = 4, IMPORTANT = 8, CHAT = 16, FRIENDS = 32, SPAM = 64, DELЕTЕD = 128, FIXED = 256, MEDIA = 512
};