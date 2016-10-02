import {SingleMessageInfo} from "./datamodels";

export class DialogView {
    message: SingleMessageInfo;
    unread: number;
    photos: string[] = ["http://vk.com/images/camera_c.gif"];
    title: string = "loading...";
    date_format: string = "MMM d y";
    sender: string;
    attachment_only: boolean = false;
    attachment_type: string = "";
    online: boolean = false;
}