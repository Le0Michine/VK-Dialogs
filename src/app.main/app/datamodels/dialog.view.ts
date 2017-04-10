import { SingleMessageInfo } from './';

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
    message: SingleMessageInfo;
    unread: number;
    photos: string[] = ['http://vk.com/images/camera_c.gif'];
    title = 'loading...';
    dateFormat = 'MMM d y';
    sender: string;
    attachmentOnly = false;
    attachmentType = '';
    online = false;
}
