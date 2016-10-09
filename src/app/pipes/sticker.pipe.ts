import { Pipe } from "@angular/core";

import { OptionsService } from "../services";

@Pipe({ name: "stickerLink" })
export class StickerPipe {
    constructor(private settings: OptionsService) { }

    transform(sticker: any) {
        console.info("sticker pipe");
        return this.settings.stickerSize.map(x => sticker[`photo_${x}`]);
    }
}