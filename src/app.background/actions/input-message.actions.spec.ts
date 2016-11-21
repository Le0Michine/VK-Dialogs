import { ActionReducer, Action } from "@ngrx/store";
import { restoreInputMessages, sendMessageFail, sendMessagePending, sendMessageSuccess, typeMessage } from "./input-message.actions";
import { InputMessageActions } from "../reducers";
import { InputMessageInfo } from "../datamodels";

describe("Input message actions", () => {

    it("should return RESTORE action", () => {
        // arrange
        let messages = [ getMessage(), getMessage(), getMessage() ];

        // act
        let result = restoreInputMessages(messages);

        // assert
        expect(result).toEqual({ type: InputMessageActions.RESTORE, payload: messages });
    });

    it("should return TYPE MESSAGE action", () => {
        // arrange
        let message = getMessage();

        // act
        let result = typeMessage(message);

        // assert
        expect(result).toEqual({ type: InputMessageActions.TYPE_MESSAGE, payload: message });
    });

    it("should return SEND MESSAGE PENDING action", () => {
        // arrange
        let message = getMessage();

        // act
        let result = sendMessagePending(message);

        // assert
        expect(result).toEqual({ type: InputMessageActions.SEND_MESSAGE_PENDING, payload: message });
    });

    it("should return SEND MESSAGE SUCCESS action", () => {
        // arrange
        // act
        let result = sendMessageSuccess(1);

        // assert
        expect(result).toEqual({ type: InputMessageActions.SEND_MESSAGE_SUCCESS, payload: { conversationId: 1 } });
    });

    it("should return SEND MESSAGE FAIL action", () => {
        // arrange
        // act
        let result = sendMessageFail(1);

        // assert
        expect(result).toEqual({ type: InputMessageActions.SEND_MESSAGE_FAIL, payload: { conversationId: 1 } });
    });

    function getMessage(): InputMessageInfo {
        return { conversationId: 1, chatId: 1, body: "body", attachments: [], state: 0 } as InputMessageInfo;
    };
});