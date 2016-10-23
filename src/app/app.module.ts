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
import { SearchComponent }  from "./search.component";
import { routing } from "./app.routing";

import { DialogService } from "./dialogs-service";
import { UserService } from "./user-service";
import { VKService } from "./vk-service";
import { ChromeAPIService } from "./chrome-api-service";
import { OptionsService } from "./services";
import { FileUploadService } from "./file-upload.service";
import { PIPES } from "./pipes";

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
        SearchComponent,
        ...PIPES
    ],
    bootstrap: [
        AppComponent
    ],
    providers: [
        Title,
        UserService,
        VKService,
        DialogService,
        ChromeAPIService,
        OptionsService,
        FileUploadService
    ]
})
export class AppModule { }