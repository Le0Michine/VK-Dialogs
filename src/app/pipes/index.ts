export * from "./attachment.pipe";
export * from "./chat-action.pipe";
export * from "./cut-links.pipe";
export * from "./format-date.pipe";
export * from "./link-to-user.pipe";
export * from "./message.pipe";
export * from "./safe.pipe";
export * from "./sticker.pipe";
export * from "./emoji.pipe";

import { MessageAttachmentIconPipe, MessageAttachmentSubTitlePipe, MessageAttachmentTitlePipe, MessageAttachmentUrlPipe } from "./attachment.pipe";
import { ChatActionPipe } from "./chat-action.pipe";
import { CutLinksPipe } from "./cut-links.pipe";
import { FormatDatePipe } from "./format-date.pipe";
import { LinkToUserPipe } from "./link-to-user.pipe";
import { ReversePipe } from "./message.pipe";
import { SafeHtmlPipe, SafeStylePipe } from "./safe.pipe";
import { StickerPipe } from "./sticker.pipe";
import { EmojiPipe } from "./emoji.pipe";

export const PIPES = [
    MessageAttachmentIconPipe,
    MessageAttachmentSubTitlePipe,
    MessageAttachmentTitlePipe,
    MessageAttachmentUrlPipe,
    ReversePipe,
    LinkToUserPipe,
    FormatDatePipe,
    CutLinksPipe,
    ChatActionPipe,
    StickerPipe,
    EmojiPipe,
    SafeHtmlPipe,
    SafeStylePipe
];