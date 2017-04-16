import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'app-messages-attachment-doc',
    templateUrl: 'attachment-doc.component.html',
    styleUrls: ['attachment-doc.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachmentDocComponent {
    @Input() doc: any;
    @Input() isRead: any;

    public videoPercent: string = '0';

    public showPreview: boolean = true;

    public constructor(
        private ref: ChangeDetectorRef
    ) { }

    public canShowPreview(): boolean {
        const doc = this.doc.doc;
        return doc && (doc.ext === 'gif' || doc.ext === 'jpg' || doc.ext === 'png');
    }

    public getPreviewUrl(): string {
        return this.doc.doc.url;
    }

    public getPreviewVideoUrl(): string {
        let preview = this.doc.doc.preview;
        return preview && preview.video ? preview.video.src : '';
    }

    public onVideoProgress(percent: number) {
        this.ref.detectChanges();
        this.videoPercent = Math.trunc(percent) + '%';
    }
}
