import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-forwarded-messages',
    templateUrl: 'forwarded-messages.component.html',
    styleUrls: ['forwarded-messages.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForwardedMessagesComponent {
    @Input() messages: any;
}
