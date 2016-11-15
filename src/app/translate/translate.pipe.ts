import { Pipe, PipeTransform } from "@angular/core";

import { TranslateService } from "./translate.service";

@Pipe({
    name: "translate"
})
export class TranslatePipe implements PipeTransform {
    constructor(private translate: TranslateService) { }

    transform(key, params = null) {
        return key ? this.translate.instant(key, params) : "";
    }
}