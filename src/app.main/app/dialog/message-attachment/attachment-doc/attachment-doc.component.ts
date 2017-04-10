import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-messages-attachment-doc',
    templateUrl: 'attachment-doc.component.html',
    styleUrls: ['attachment-doc.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachmentDocComponent {
    @Input() doc: any;
    @Input() isRead: any;
}
