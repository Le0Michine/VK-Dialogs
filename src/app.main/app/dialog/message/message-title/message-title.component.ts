import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { UserInfo } from '../../../datamodels';

@Component({
    selector: 'app-message-title',
    templateUrl: 'message-title.component.html',
    styleUrls: ['message-title.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageTitleComponent {
    @Input() user: UserInfo;
    @Input() date: number;
    @Input() dateOnNewLine: boolean;
}
