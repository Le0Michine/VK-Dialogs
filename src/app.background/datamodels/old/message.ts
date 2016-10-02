import { User } from "./user";

export let CHAT_ACTIONS = {
    "chat_photo_remove": "removed chat photo",
    "chat_kick_user": "left chat"
};

export class Message {
    // Message ID. (Not returned for forwarded messages.)
    // positive number
    id: number;

    // For an incoming message, the user ID of the author. For an outgoing message, the user ID of the receiver.
    // positive number
    user_id: number;

    // Date (in Unix time) when the message was sent.
    // positive number
    date: number;

    // Message status (0 — not read, 1 — read). (Not returned for forwarded messages.)
    // flag, either 1 or 0
    read_state: boolean;

    // Message type (0 — received, 1 — sent). (Not returned for forwarded messages.)
    // flag, either 1 or 0
    out: boolean;

    // Title of message or chat.
    // string
    title: string;

    // Body of the message.
    // string
    body: string;

    // Array of media-attachments; see Description of "attachments" field. (https://new.vk.com/dev/attachments_m)
    attachments: any;

    // Array of forwarded messages (if any).
    fwd_messages: any;

    // Whether the message contains smiles (0 — no, 1 — yes).
    // flag, either 1 or 0
    emoji: boolean;

    // Whether the message is deleted (0 — no, 1 — yes).
    // flag, either 1 or 0
    deleted: boolean;

    // id of sender
    from_id: number;
}

export class Chat extends Message {
    // Chat ID.
    // positive number
    chat_id: number;

    // User IDs of chat participants.
    // list comma-separated positive numbers
    chat_active: number[];

    // Number of chat participants.
    // positive number
    users_count: number;

    // ID of user who started the chat.
    // positive number
    admin_id: number;

    // URL of chat image with width size of 50px.
    // string
    photo_50: string;

    // URL of chat image with width size of 100px.
    // string
    photo_100: string;

    // URL of chat image with width size of 200px.
    // string
    photo_200: string;

    action: string;
}