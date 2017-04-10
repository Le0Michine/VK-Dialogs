import { historyReducer, HistoryActions } from './history.reducer';
import { HistoryInfo } from '../datamodels';

describe('History reducer', () => {
    let state;

    beforeEach(() => {
        state = {} as HistoryInfo;
        state.count = 3;
    });

    it('should return new history on HISTORY_LOADED action', () => {
        // arrange
        const history = {} as HistoryInfo;
        history.count = 7;

        // act
        const result = historyReducer(state, { type: HistoryActions.UPDATE, payload: history });

        // assert
        expect(result).toBe(history);
    });

    it('should return old history by default', () => {
        // arrange
        const history = {} as HistoryInfo;
        history.count = 7;

        // act
        const result = historyReducer(state, { type: 'unknown_action', payload: history });

        // assert
        expect(result).toBe(state);
    });
});
