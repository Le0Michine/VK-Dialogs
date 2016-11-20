import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import "rxjs/add/observable/of";

import { ru } from "./_ru";
import { en } from "./_en";

@Injectable()
export class TranslateService {
    private defaultLang: string = "en";
    private currentLang: string = "en";
    private locales = { ru, en };

    constructor() { }

    setDefaultLang(lang: string) {
        if (this.locales.hasOwnProperty(lang)) {
            this.defaultLang = lang;
        } else {
            throw new Error(`Specified lang ${lang} doesn't exist in locales ${this.locales}`);
        }
    }

    use(lang: string) {
        if (this.locales.hasOwnProperty(lang)) {
            this.currentLang = lang;
        } else {
            throw new Error(`Specified lang ${lang} doesn't exist in locales ${JSON.stringify(this.locales)}`);
        }
    }

    get(term: string, params: any = null): Observable<string> {
        return Observable.of(this.instant(term, params));
    }

    instant(term: string, params: any = null): string {
        if (!term) {
            let error = new Error("Parameter \"term\" should be specified, stack: ");
            error.message += error.stack;
            throw error;
        }

        let translation: string = this.locales[this.currentLang];
        let defaultTranslation: string = this.locales[this.defaultLang];

        for (let k of term.split(".")) {
            if (translation) {
                translation = translation[k];
            }
            if (defaultTranslation) {
                defaultTranslation = defaultTranslation[k];
            }
        }
        translation = translation || defaultTranslation;
        if (!translation && translation !== "") {
            throw new Error(`Unable to find translation term by key ${term} in dictionary ${JSON.stringify(this.locales)}`);
        }
        if (params) {
            let keys = Object.keys(params);
            for (let k of keys.filter(x => params.hasOwnProperty(x))) {
                translation = translation.replace("{{" + k + "}}", params[k]);
            }
        }
        return translation || defaultTranslation;
    }
}