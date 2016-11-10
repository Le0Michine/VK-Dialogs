import { historyReducer, HistoryActions } from "./history.reducer";
import { HistoryInfo, SingleMessageInfo, HistoryListInfo } from "../datamodels";

describe("Background History reducer", () => {
    let state: HistoryListInfo;

    beforeEach(() => {
        state = new HistoryListInfo();
        let history = createHistoryWithRange(1, 5, "init");
        state.conversationIds = [ 1 ];
        state.history[1] = history;
    });

    it("should replace all the history if head and tails are the same", () => {
        // arrange
        let history = createHistoryWithRange(1, 5, "new");

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_UPDATED, payload: history });

        // assert
        expect(result.history[1].messages).toEqual(history.messages);
    });

    it("should replace internal part of the history", () => {
        // arrange
        let history = createHistoryWithRange(2, 4, "new");

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_UPDATED, payload: history });

        // assert
        expect(result.history[1].messages.map(x => x.body)).toEqual([ "init1", "new2", "new3", "new4", "init5" ]);
    });

    it("should replace left part of the history", () => {
        // arrange
        let history = createHistoryWithRange(1, 4, "new");

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_UPDATED, payload: history });

        // assert
        expect(result.history[1].messages.map(x => x.body)).toEqual([ "new1", "new2", "new3", "new4", "init5" ]);
    });

    it("should replace right part of the history", () => {
        // arrange
        let history = createHistoryWithRange(2, 5, "new");

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_UPDATED, payload: history });

        // assert
        expect(result.history[1].messages.map(x => x.body)).toEqual([ "init1", "new2", "new3", "new4", "new5" ]);
    });

    it("should merge left part of the history in case of intersection", () => {
        // arrange
        let history = createHistoryWithRange(0, 3, "new");

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_UPDATED, payload: history });

        // assert
        expect(result.history[1].messages.map(x => x.body)).toEqual([ "new0", "new1", "new2", "new3", "init4", "init5" ]);
    });

    it("should merge right part of the history in case of intersection", () => {
        // arrange
        let history = createHistoryWithRange(4, 6, "new");

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_UPDATED, payload: history });

        // assert
        expect(result.history[1].messages.map(x => x.body)).toEqual([ "init1", "init2", "init3", "new4", "new5", "new6" ]);
    });

    it("should replace the history in case if intersection doesn't exist", () => {
        // arrange
        let history = createHistoryWithRange(7, 10, "new");

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_UPDATED, payload: history });

        // assert
        expect(result.history[1].messages.map(x => x.body)).toEqual([ "new7", "new8", "new9", "new10" ]);
    });

    it("should replace the history in case if new history includes the old one as a sub array", () => {
        // arrange
        let history = createHistoryWithRange(0, 6, "new");

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_UPDATED, payload: history });

        // assert
        expect(result.history[1].messages.map(x => x.body)).toEqual([ "new0", "new1", "new2", "new3", "new4", "new5", "new6" ]);
    });

    it("should add a new history list with different id", () => {
        // arrange
        let history = createHistoryWithRange(0, 6, "new");
        history.conversationId = 2;

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_UPDATED, payload: history });

        // assert
        expect(result.history[1]).toEqual(state.history[1]);
        expect(result.history[2]).toEqual(history);
        expect(result.conversationIds).toEqual([ 1, 2 ]);
    });

    it("should create new history list info with one history info object", () => {
        // arrange
        let history = createHistoryWithRange(0, 6, "new");
        history.conversationId = 2;

        // act
        let result = historyReducer(state, { type: HistoryActions.HISTORY_LOADED, payload: history });

        // assert
        expect(result.history[2]).toEqual(history);
        expect(result.conversationIds).toEqual([ 2 ]);
    });

    it("should return old history by default", () => {
        // arrange
        let history = createHistoryWithRange(0, 10);

        // act
        let result = historyReducer(state, { type: "unknown_action", payload: history });

        // assert
        expect(result).toBe(state);
    });

    const createHistoryWithRange = function (start: number, end: number, body: string = "new"): HistoryInfo {
        let history = new HistoryInfo();
        history.conversationId = 1;
        history.count = 90;
        history.messages = [];
        for (let i = start; i <= end; i++) {
            let m = new SingleMessageInfo();
            m.id = i;
            m.body = body + i;
            history.messages.push(m);
        }
        return history;
    };
});