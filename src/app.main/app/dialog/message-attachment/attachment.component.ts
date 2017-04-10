import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-messages-attachment',
    templateUrl: 'attachment.component.html',
    styleUrls: ['attachment.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachmentComponent {
    @Input() attachment: any;
    @Input() isRead: any;
}
