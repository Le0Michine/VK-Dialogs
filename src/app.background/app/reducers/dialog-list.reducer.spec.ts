import { dialogListReducer, DialogListActions } from './dialog-list.reducer';
import { DialogInfo, DialogListInfo, SingleMessageInfo } from '../datamodels';

describe('Background dialog-list reducer', () => {
    let state: DialogListInfo;

    beforeEach(() => {
        state = createDialogListWithIdRange(1, 5, 'init', 500);
    });

    it('should replace all dialogs if arrays starts and ends with the same dialog', () => {
        // arrange
        const dialogs = createDialogListWithIdRange(1, 5, 'new', 1000);

        // act
        const result = dialogListReducer(state, { type: DialogListActions.DIALOGS_UPDATED, payload: dialogs });

        // assert
        expect(result.dialogs).toEqual(dialogs.dialogs);
    });

    it('should replace left part of dialog list in case of left intersection', () => {
        // arrange
        const dialogs = createDialogListWithIdRange(0, 2, 'new', 1000);

        // act
        const result = dialogListReducer(state, { type: DialogListActions.DIALOGS_UPDATED, payload: dialogs });

        // assert
        expect(result.dialogs.map(x => x.message.body)).toEqual([ 'new0', 'new1', 'new2', 'init3', 'init4', 'init5' ]);
    });

    it('should replace right part of dialog list in case of right intersection', () => {
        // arrange
        const dialogs = createDialogListWithIdRange(3, 6, 'old', 300);

        // act
        const result = dialogListReducer(state, { type: DialogListActions.DIALOGS_UPDATED, payload: dialogs });

        // assert
        expect(result.dialogs.map(x => x.message.body)).toEqual([ 'init1', 'init2', 'old3', 'old4', 'old5', 'old6' ]);
    });

    it('should replace left part of dialog list in case of left intersection with reordering', () => {
        // arrange
        const dialogs = createDialogListWithIdRange(7, 10, 'new', 1000);
        // tslint:disable-next-line:max-line-length
        dialogs.dialogs = [ { message: { peerId: 5, body: 'new5', date: 570 } }, { message: { peerId: 4, body: 'new4', date: 560 } }, { message: { peerId: 0, body: 'new0', date: 550 } } ] as DialogInfo[];

        // act
        const result = dialogListReducer(state, { type: DialogListActions.DIALOGS_UPDATED, payload: dialogs });

        // assert
        expect(result.dialogs.map(x => x.message.body)).toEqual([ 'new5', 'new4', 'new0', 'init1', 'init2', 'init3' ]);
    });

    it('should save new dialog list on DIALOGS_LOADED event', () => {
        // arrange
        const dialogs = createDialogListWithIdRange(7, 10, 'new', 1000);

        // act
        const result = dialogListReducer(state, { type: DialogListActions.DIALOGS_LOADED, payload: dialogs });

        // assert
        expect(result.dialogs.map(x => x.message.body)).toEqual([ 'new7', 'new8', 'new9', 'new10' ]);
    });

    it('should return init list by default', () => {
        // arrange
        const dialogs = createDialogListWithIdRange(7, 10, 'new', 1000);

        // act
        const result = dialogListReducer(state, { type: 'some unknown action type', payload: dialogs });

        // assert
        expect(result.dialogs.map(x => x.message.body)).toEqual([ 'init1', 'init2', 'init3', 'init4', 'init5' ]);
    });

    function createDialogListWithIdRange (start: number, end: number, body: string, time: number): DialogListInfo {
        const dialogList = {} as DialogListInfo;
        dialogList.count = 100;
        dialogList.unread = 5;
        dialogList.dialogs = [];
        for (let i = start; i <= end; i++) {
            const d = {} as DialogInfo;
            d.message = {} as SingleMessageInfo;
            d.message.peerId = i;
            d.message.body = body + i;
            d.message.date = time - i;
            dialogList.dialogs.push(d);
        }
        return dialogList;
    };
});
