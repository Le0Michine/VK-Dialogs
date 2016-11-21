import { authorizationReducer, AuthorizationActions } from "./authorization.reducer";

describe("Authorization reducer", () => {

    it("return previous state by default", () => {
        // arrange
        // act
        let result1 = authorizationReducer(false, { type: "unknown action", payload: null });
        let result2 = authorizationReducer(true, { type: "unknown action", payload: null });

        // assert
        expect(result1).toBe(false);
        expect(result2).toBe(true);
    });

    it("return true on LOGIN", () => {
        // arrange
        // act
        let result = authorizationReducer(null, { type: AuthorizationActions.LOGIN, payload: null });

        // assert
        expect(result).toBe(true);
    });

    it("return false on LOGOFF", () => {
        // arrange
        // act
        let result = authorizationReducer(null, { type: AuthorizationActions.LOGOFF, payload: null });

        // assert
        expect(result).toBe(false);
    });
});