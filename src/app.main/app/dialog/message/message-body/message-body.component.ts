import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-message-body',
    templateUrl: 'message-body.component.html',
    styleUrls: ['message-body.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessageBodyComponent {
    @Input() body: string;
}
