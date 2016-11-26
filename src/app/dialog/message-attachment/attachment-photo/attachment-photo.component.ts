import { Component, Input } from "@angular/core";

@Component({
    selector: "messages-attachment-photo",
    templateUrl: "attachment-photo.component.html",
    styleUrls: [
        "attachment-photo.component.css"
    ]
})
export class AttachmentPhotoComponent {
    @Input() photo: any;

    photoZoomIn: boolean = true;
    photoSrc: string;

    ngOnInit() {
        this.photoSrc = this.photo.photo_130;
    }

    changePhotoSize(): void {
        if (this.photoSrc === this.photo.photo_130) {
            this.photoSrc = this.photo.photo_604;
            this.photoZoomIn = false;
        }
        else if (this.photoSrc === this.photo.photo_604) {
            this.photoSrc = this.photo.photo_130;
            this.photoZoomIn = true;
        }
    }
}