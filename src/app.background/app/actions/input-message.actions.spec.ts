import { ActionReducer, Action } from '@ngrx/store';
import { restoreInputMessages, sendMessageFail, sendMessagePending, sendMessageSuccess, typeMessage } from './input-message.actions';
import { InputMessageActions } from '../reducers';
import { InputMessageInfo } from '../datamodels';

describe('Input message actions', () => {

    it('should return RESTORE action', () => {
        // arrange
        const messages = [ getMessage(), getMessage(), getMessage() ];

        // act
        const result = restoreInputMessages(messages);

        // assert
        expect(result).toEqual({ type: InputMessageActions.RESTORE, payload: messages });
    });

    it('should return TYPE MESSAGE action', () => {
        // arrange
        const message = getMessage();

        // act
        const result = typeMessage(message);

        // assert
        expect(result).toEqual({ type: InputMessageActions.TYPE_MESSAGE, payload: message });
    });

    it('should return SEND MESSAGE PENDING action', () => {
        // arrange
        const message = getMessage();

        // act
        const result = sendMessagePending(message);

        // assert
        expect(result).toEqual({ type: InputMessageActions.SEND_MESSAGE_PENDING, payload: message });
    });

    it('should return SEND MESSAGE SUCCESS action', () => {
        // arrange
        // act
        const result = sendMessageSuccess(1);

        // assert
        expect(result).toEqual({ type: InputMessageActions.SEND_MESSAGE_SUCCESS, payload: { peerId: 1 } });
    });

    it('should return SEND MESSAGE FAIL action', () => {
        // arrange
        // act
        const result = sendMessageFail(1);

        // assert
        expect(result).toEqual({ type: InputMessageActions.SEND_MESSAGE_FAIL, payload: { peerId: 1 } });
    });

    function getMessage(): InputMessageInfo {
        return { peerId: 1, chatId: 1, body: 'body', attachments: [], state: 0 } as InputMessageInfo;
    };
});
