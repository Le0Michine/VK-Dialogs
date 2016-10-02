import { Pipe } from "@angular/core";

@Pipe({
    name: "reverse"
})
export class ReversePipe {
    transform(array: any[]) {
        return array.reverse();
    }
}

@Pipe({
    name: "escape"
})
export class EscapePipe {
    transform(text) {
        return text.trim()
            .replace(/%/g,  "%25")
            .replace(/\n/g, "%0A")
            .replace(/!/g,  "%21")
            .replace(/"/g,  "%22")
            .replace(/#/g,  "%23")
            .replace(/\$/g, "%24")
            .replace(/&/g,  "%26")
            .replace(/'/g,  "%27")
            .replace(/\(/g, "%28")
            .replace(/\)/g, "%29")
            .replace(/\*/g, "%2A")
            .replace(/\+/g, "%2B")
            .replace(/,/g,  "%2C")
            .replace(/-/g,  "%2D");
    }
}