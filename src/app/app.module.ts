import { NgModule, ChangeDetectorRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { BrowserModule, Title } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { TranslateModule } from "ng2-translate/ng2-translate";

import { AppComponent }  from "./app.component";
import { DialogsComponent }  from "./dialogs.component";
import { DialogComponent }  from "./dialog.component";
import { LoginComponent }  from "./login.component";
import { EmojiComponent }  from "./emoji.component";
import { routing } from "./app.routing";

import { DialogService } from "./dialogs-service";
import { UserService } from "./user-service";
import { VKService } from "./vk-service";
import { EmojiService } from "./emoji-service";
import { ChromeAPIService } from "./chrome-api-service";
import { MessageAttachmentIconPipe, MessageAttachmentSubTitlePipe, MessageAttachmentTitlePipe, MessageAttachmentUrlPipe, ChatActionPipe, SafePipe, CutLinksPipe, EmojiPipe } from "./attachment.pipe";

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
        LoginComponent,
        EmojiComponent,
        MessageAttachmentIconPipe,
        MessageAttachmentSubTitlePipe,
        MessageAttachmentTitlePipe,
        MessageAttachmentUrlPipe,
        ChatActionPipe,
        SafePipe,
        CutLinksPipe,
        EmojiPipe
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