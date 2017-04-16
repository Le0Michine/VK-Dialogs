import { Component, Input, ChangeDetectionStrategy, OnInit } from '@angular/core';

@Component({
    selector: 'app-messages-attachment-photo',
    templateUrl: 'attachment-photo.component.html',
    styleUrls: ['attachment-photo.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttachmentPhotoComponent implements OnInit {
    @Input() photo: any;

    photoZoomIn = true;
    photoSrc: string;

    ngOnInit() {
        this.photoSrc = this.photo.photo_604 || this.photo.photo_130 || this.photo.photo_75;
    }

    changePhotoSize(): void {
        if (this.photoSrc === this.photo.photo_130) {
            this.photoSrc = this.photo.photo_604;
            this.photoZoomIn = false;
        } else if (this.photoSrc === this.photo.photo_604) {
            this.photoSrc = this.photo.photo_130;
            this.photoZoomIn = true;
        }
    }
}
