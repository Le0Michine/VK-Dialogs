import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule, Title } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { TranslateModule } from "ng2-translate/ng2-translate";

import { AppComponent }  from "./app.component";
import { DialogListComponent }  from "./dialog-list.component";
import { DialogComponent }  from "./dialog.component";
import { LoginComponent }  from "./login.component";
import { MessageInputComponent }  from "./message-input.component";
import { MessagesListComponent }  from "./messages-list.component";
import { EmojiComponent }  from "./emoji.component";
import { PopupMenuComponent }  from "./popup-menu.component";
import { routing } from "./app.routing";

import { DialogService } from "./dialogs-service";
import { UserService } from "./user-service";
import { VKService } from "./vk-service";
import { EmojiService } from "./emoji-service";
import { ChromeAPIService } from "./chrome-api-service";
import { OptionsService } from "./options.service";
import { FileUploadService } from "./file-upload.service";
import { ReversePipe, EscapePipe } from "./pipes/message.pipe";
import { ChatActionPipe } from "./pipes/chat-action.pipe";
import { CutLinksPipe } from "./pipes/cut-links.pipe";
import { EmojiPipe } from "./pipes/emoji.pipe";
import { LinkToUserPipe } from "./pipes/link-to-user.pipe";
import { FormatDatePipe } from "./pipes/format-date.pipe";
import { SafeHtmlPipe, SafeStylePipe } from "./pipes/safe.pipe";
import { MessageAttachmentIconPipe, MessageAttachmentSubTitlePipe, MessageAttachmentTitlePipe, MessageAttachmentUrlPipe } from "./pipes/attachment.pipe";

@NgModule({
    imports: [
        BrowserModule,
        HttpModule,
        FormsModule,
        routing,
        TranslateModule.forRoot()
    ],
    declarations: [
        AppComponent,
        DialogComponent,
        DialogListComponent,
        MessageInputComponent,
        MessagesListComponent,
        LoginComponent,
        EmojiComponent,
        PopupMenuComponent,
        MessageAttachmentIconPipe,
        MessageAttachmentSubTitlePipe,
        MessageAttachmentTitlePipe,
        MessageAttachmentUrlPipe,
        ChatActionPipe,
        SafeHtmlPipe,
        SafeStylePipe,
        CutLinksPipe,
        EmojiPipe,
        ReversePipe,
        EscapePipe,
        FormatDatePipe,
        LinkToUserPipe
    ],
    bootstrap: [
        AppComponent
    ],
    providers: [
        Title,
        UserService,
        VKService,
        DialogService,
        EmojiService,
        ChromeAPIService,
        OptionsService,
        FileUploadService
    ]
})
export class AppModule { }