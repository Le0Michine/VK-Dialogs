import { NgModule, ModuleWithProviders } from "@angular/core";

import { TranslatePipe } from "./translate.pipe";
import { TranslateService } from "./translate.service";

@NgModule({
    declarations: [
        TranslatePipe
    ],
    exports: [
        TranslatePipe
    ]
})
export class TranslateModule {
    static forRoot(): ModuleWithProviders {
        return {
            ngModule: TranslateModule,
            providers: [
                { provide: TranslateService, useClass: TranslateService }
            ]
        };
    }
}