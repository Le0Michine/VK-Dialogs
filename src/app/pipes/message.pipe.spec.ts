import { ReversePipe } from "./message.pipe";

describe("Reverse pipe", () => {
    let pipe: ReversePipe;

    beforeEach(() => {
        pipe = new ReversePipe();
    });

    it("should reverse array", () => {
        // arrange
        let arr = [1, 2, 3];
        let expectedResult = [3, 2, 1];

        // act
        let result = pipe.transform(arr);

        // assert
        expect(result).toEqual(expectedResult);
    });
});