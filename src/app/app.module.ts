import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule, Title } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { TranslateModule } from "ng2-translate/ng2-translate";

import { AppComponent }  from "./app.component";
import { DialogsComponent }  from "./dialogs.component";
import { DialogComponent }  from "./dialog.component";
import { LoginComponent }  from "./login.component";
import { MessageInputComponent }  from "./message-input.component";
import { MessagesListComponent }  from "./messages-list.component";
import { EmojiComponent }  from "./emoji.component";
import { routing } from "./app.routing";

import { DialogService } from "./dialogs-service";
import { UserService } from "./user-service";
import { VKService } from "./vk-service";
import { EmojiService } from "./emoji-service";
import { ChromeAPIService } from "./chrome-api-service";
import { ReversePipe, EscapePipe } from "./pipes/message.pipe";
import { ChatActionPipe } from "./pipes/chat-action.pipe";
import { CutLinksPipe } from "./pipes/cut-links.pipe";
import { EmojiPipe } from "./pipes/emoji.pipe";
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
        DialogsComponent,
        MessageInputComponent,
        MessagesListComponent,
        LoginComponent,
        EmojiComponent,
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
        FormatDatePipe
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
        ChromeAPIService
    ]
})
export class AppModule { }