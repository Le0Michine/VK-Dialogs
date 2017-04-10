import { Pipe, PipeTransform } from '@angular/core';

import { OptionsService } from '../services';

@Pipe({ name: 'stickerLink' })
export class StickerPipe implements PipeTransform {
    constructor(private settings: OptionsService) { }

    transform(sticker: any) {
        return this.settings.stickerSize.map(x => sticker[`photo_${x}`]);
    }
}
