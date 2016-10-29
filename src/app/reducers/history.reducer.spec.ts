import { historyReducer, HistoryActions } from "./history.reducer";
import { HistoryInfo } from "../datamodels";

describe("History reducer", () => {
    let state;

    beforeEach(() => {
        state = new HistoryInfo();
        state.count = 3;
    });

    it("should return new history on HISTORY_LOADED action", () => {
        // arrange
        let history = new HistoryInfo();
        history.count = 7;

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_LOADED, payload: history });

        // assert
        expect(result).toBe(history);
    });

    it("should return old history by default", () => {
        // arrange
        let history = new HistoryInfo();
        history.count = 7;

        // act
        let result = historyReducer(state, { type: "unknown_action", payload: history });

        // assert
        expect(result).toBe(state);
    });
});