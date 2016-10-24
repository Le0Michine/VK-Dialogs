import { inject, TestBed, async } from "@angular/core/testing";
import { BehaviorSubject, Observable } from "rxjs/Rx";

import { StickerPipe } from "./sticker.pipe";
import { OptionsService } from "../services";

class OptionsServiceMock {
    stickerSize = new BehaviorSubject<number>(120);
}

describe("Sticker pipe", () => {
    let pipe: StickerPipe;
    let optionsService: OptionsServiceMock;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ {provide: OptionsService, useClass: OptionsServiceMock} ]
        });
    });

    beforeEach(inject([OptionsService], (service: OptionsService) => {
        pipe = new StickerPipe(service);
        optionsService = service;
    }));

    it("should return correct link", done => {
        // arrange
        let sticker: any = {};
        sticker.photo_120 = "link to photo";

        // act
        let result = pipe.transform(sticker);

        // assert
        result.subscribe(x => {
            expect(x).toEqual(sticker.photo_120);
            done();
        });
    });
});