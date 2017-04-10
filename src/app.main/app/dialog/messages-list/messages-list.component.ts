import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { SingleMessageInfo, UserInfo, HistoryInfo, OneDayMessagesGroup, UserSex } from '../../datamodels';

@Component({
    selector: 'app-messages-list',
    templateUrl: 'messages-list.component.html',
    styleUrls: ['messages-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessagesListComponent {
    @Input() historyToShow: OneDayMessagesGroup[];
    @Input() isForwarded: boolean;
    @Input() participants: {[id: number]: UserInfo} = {};

    public getUserInfo(uid: number): UserInfo {
        return this.participants[uid] || {} as UserInfo;
    }

    public getUserSex(uid: number): UserSex {
        return (this.participants[uid] || { sex: UserSex.undefined }).sex;
    }
}
