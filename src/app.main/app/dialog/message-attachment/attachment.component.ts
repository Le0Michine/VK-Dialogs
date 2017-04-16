import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { UserInfo } from '../../datamodels';

@Component({
    selector: 'app-messages-attachment',
    templateUrl: 'attachment.component.html',
    styleUrls: ['attachment.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachmentComponent {
    @Input() attachment: any;
    @Input() isRead: any;
    @Input() users: {[id: number]: UserInfo} = {};
}
