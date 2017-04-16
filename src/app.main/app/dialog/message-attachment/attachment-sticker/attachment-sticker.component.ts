import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-messages-attachment-sticker',
    templateUrl: 'attachment-sticker.component.html',
    styleUrls: ['attachment-sticker.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachmentStickerComponent {
    @Input() sticker: any;
}
