import { SingleMessageInfo } from './';
import { VKUtils } from '../../../app.shared/vk-utils';

export interface IDialogView {
    message: SingleMessageInfo;
    unread: number;
    photos: string[];
    title: string;
    dateFormat: string;
    sender: string;
    attachmentOnly: boolean;
    attachmentType: string;
    online: boolean;
}

export class DialogView implements IDialogView {
    peerId: number;
    message: SingleMessageInfo;
    unread: number;
    photos: string[] = [ VKUtils.getAvatarPlaceholder() ];
    title = 'loading...';
    dateFormat = 'MMM d y';
    sender: string;
    attachmentOnly = false;
    attachmentType = '';
    online = false;
}
