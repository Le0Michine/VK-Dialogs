import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { SingleMessageInfo, UserInfo, HistoryInfo, OneDayMessagesGroup, OneSenderMessagesGroup, UserSex } from '../../datamodels';

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

    public trackByOneDayMessagesGroup(oneDayMessagesGroup: OneDayMessagesGroup): number {
        return oneDayMessagesGroup ? oneDayMessagesGroup.groupId : null;
    }

    public trackByOneSenderMessagesGroup(oneSenderMessagesGroup: OneSenderMessagesGroup): number {
        return oneSenderMessagesGroup ? oneSenderMessagesGroup.groupId : null;
    }

    public trackByMessageId(message: SingleMessageInfo): number {
        return message.id;
    }
}
