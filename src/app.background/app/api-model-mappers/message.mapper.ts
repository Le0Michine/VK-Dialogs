import { SingleMessageInfo, DialogInfo, HistoryInfo, ChatInfo, DialogListInfo, DialogShortInfo, GeoAtt, MessageAttachment } from '../datamodels';
import { VKUtils } from '../vk-utils';
import { UserMapper } from './user.mapper';

export class MessageMapper {

    public static toDialogsShort(json: any[]): DialogShortInfo[] {
        const dialogs: DialogShortInfo[] = json.map(x => ({
            id: VKUtils.getPeerId(x.id, x.type === 'chat' ? x.id : 0),
            title: x.title || `${x.first_name} ${x.last_name}`,
            type: x.type
        } as DialogShortInfo));

        return dialogs;
    }

    public static toDialogsInfo(json: any, currentUserID: number): DialogListInfo {
        return {
            dialogs: json.items.map(x => MessageMapper.toDialogViewModel(x, currentUserID)),
            count: json.count,
            unread: json.unread_dialogs
        };
    }

    public static toChatList(json: any): ChatInfo[] {
        return json.map(jsonChat => MessageMapper.toChatViewModel(jsonChat));
    }

    public static toChatViewModel(json: any): ChatInfo {
        return {
            adminId: json.admin_id,
            id: json.id,
            title: json.title,
            users: json.users.map(u => UserMapper.toUserViewModel(u)),
            type: json.type
        };
    }

    public static toHistoryViewModel(json: any, currentUserID: number): HistoryInfo {
        const messages = json.items.map(x => MessageMapper.toSingleMessageViewModel(x, currentUserID));
        return {
            count: json.count,
            messages: messages,
            peerId: messages.length ? messages[0].peerId : 0,
            isChat: messages.length && messages[0].chatId ? true : false,
            conversationTitle: messages.length ? messages[0].title : ''
        };
    }

    public static toDialogViewModel(json: any, currentUserID: number): DialogInfo {
        return {
            unreadCount: json.unread,
            message: MessageMapper.toSingleMessageViewModel(json.message, currentUserID)
        };
    }

    public static toSingleMessageViewModel(json: any, currentUserID: number): SingleMessageInfo {
        const message: SingleMessageInfo = {
            id: json.id,
            randomId: json.random_id,
            peerId: VKUtils.getPeerId(json.user_id, json.chat_id),
            action: json.action,
            actionMid: json.action_mid,
            attachments: MessageMapper.toAttachmentsViewModel(json.attachments || []),
            body: json.body,
            userId: json.user_id,
            chatId: json.chat_id,
            date: json.date,
            fromId: json.from_id || (json.out ? currentUserID : json.user_id),
            fwdMessages: json.fwd_messages ? json.fwd_messages.map(x => MessageMapper.toSingleMessageViewModel(x, currentUserID)) : null,
            isRead: !!json.read_state,
            out: !!json.out,
            photo50: json.photo_50,
            title: json.title
        };
        const geo = MessageMapper.toGeoAttachment(json.geo);
        if (geo) {
            message.attachments.push(geo);
        }
        return message;
    }

    public static toGeoAttachment(json: any): MessageAttachment {
        return json ? { geo: json, type: 'geo' } : null;
    }

    public static toAttachmentsViewModel(jsonAttachments: any[]): MessageAttachment[] {
        return jsonAttachments;
    }
}
