import { inject, TestBed, ComponentFixture } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { Subject } from "rxjs/Subject";
import { By } from "@angular/platform-browser";
import { DebugElement, ApplicationRef, Directive, Input } from "@angular/core";
import { StoreModule, Store } from "@ngrx/store";

import { MessageInputComponent } from "./message-input.component";
import { AppState, appState } from "../../app.store";
import { TranslateModule } from "../../translate";
import { DialogService } from "../../services";
import { replaceMessage } from "../../actions";
import { UserListInfo, DialogListInfo, ChatListInfo, HistoryListInfo, InputMessageListInfo, MenuItem } from "../../datamodels";

class DialogServiceTest {
    sendMessage(id: number, message: any, chat: boolean): void {}
    typeMessage(id: number, message: any, chat: boolean): void {}
}

describe("Message input component", () => {
    let fixture: ComponentFixture<MessageInputComponent>;
    let component: MessageInputComponent;
    let store: Store<AppState>;
    let dialogService: DialogServiceTest;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                StoreModule.provideStore(appState, INITIAL_APP_STATE),
                TranslateModule.forRoot()
            ],
            declarations: [ MessageInputComponent ],
            schemas: [ NO_ERRORS_SCHEMA ],
            providers: [ { provide: DialogService, useClass: DialogServiceTest } ]
        });
        fixture = TestBed.createComponent(MessageInputComponent);
        component = fixture.componentInstance;
        component.selectEmoji = new Subject();
        component.onSendMessageClick = new Subject();
        component.attachmentUploaded = new Subject();
        component.newAttachment = new Subject();
        component.removeAttachment = new Subject();
        component.conversationId = 1;
        component.isChat = false;
        fixture.detectChanges();
    });

    beforeEach(inject([ Store, DialogService ], (appStore: Store<AppState>, service: DialogServiceTest) => {
        store = appStore;
        dialogService = service;
    }));

    it("should display empty input with placeholder", () => {
        // arrange
        fixture.detectChanges();

        // act
        let input = getInputField();
        let placeholder = getPlaceholder();

        // assert
        expect(input).not.toBeNull();
        expect(placeholder).not.toBeNull();
    });

    it("should display input without placeholder", () => {
        // arrange
        component.inputText = "test";
        component.updateInputMessage();
        fixture.detectChanges();

        // act
        let input = getInputField();
        let placeholder = getPlaceholder();

        // assert
        expect(input.innerText).toBe("test");
        expect(component.inputLabelVisible).toBe(false);
        expect(placeholder).toBeNull();
    });

    function getInputField() {
        let element = fixture.debugElement.query(By.css("#message_input"));
        return element ? element.nativeElement : null;
    }

    function getPlaceholder() {
        let element = fixture.debugElement.query(By.css("label.input-label"));
        return element ? element.nativeElement : null;
    }

    const INITIAL_APP_STATE = {
        breadcrumbs: [],
        users: new UserListInfo(),
        dialogs: new DialogListInfo(),
        chats: new ChatListInfo(),
        history: new HistoryListInfo(),
        currentConversationId: -1,
        router: { path: "/dialogs" },
        inputMessages: new InputMessageListInfo()
    };
});