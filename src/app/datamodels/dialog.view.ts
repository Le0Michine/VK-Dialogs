import { SingleMessageInfo } from "./datamodels";

export class DialogView {
    message: SingleMessageInfo;
    unread: number;
    photos: string[] = ["http://vk.com/images/camera_c.gif"];
    title: string = "loading...";
    dateFormat: string = "MMM d y";
    sender: string;
    attachmentOnly: boolean = false;
    attachmentType: string = "";
    online: boolean = false;
}