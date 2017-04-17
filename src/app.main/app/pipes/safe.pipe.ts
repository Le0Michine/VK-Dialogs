import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safe' })
export class SafeHtmlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(html) {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}

@Pipe({ name: 'safeStyle' })
export class SafeStylePipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(css) {
        return this.sanitizer.bypassSecurityTrustStyle(css);
    }
}

@Pipe({ name: 'safeResourceUrl' })
export class SafeRecourseUrlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(url) {
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
}

@Pipe({ name: 'safeUrl' })
export class SafeUrlPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(url) {
        return this.sanitizer.bypassSecurityTrustUrl(url);
    }
}
