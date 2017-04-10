import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { UserInfo } from '../../../datamodels';

@Component({
    selector: 'app-user-avatar',
    templateUrl: 'user-avatar.component.html',
    styleUrls: ['user-avatar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserAvatarComponent {
    @Input() user: UserInfo;
}
