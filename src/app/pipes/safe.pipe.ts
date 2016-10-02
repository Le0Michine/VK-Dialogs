import { Pipe } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({ name: "safe" })
export class SafeHtmlPipe {
    constructor(private sanitizer: DomSanitizer) { }

    transform(html) {
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}

@Pipe({ name: "safeStyle" })
export class SafeStylePipe {
    constructor(private sanitizer: DomSanitizer) { }

    transform(css) {
        return this.sanitizer.bypassSecurityTrustStyle(css);
    }
}