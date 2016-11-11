import { Component } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Store } from "@ngrx/store";

import { BreadcrumbItem } from "../datamodels";
import { AppStore } from "../app.store";

@Component({
    selector: "breadcrumb",
    templateUrl: "breadcrumb.component.html",
    styleUrls: [
        "../css/color-scheme.css",
        "../css/font-style.css",
        "./breadcrumb.component.css"
    ]
})
export class BreadcrumbComponent {
    items: Observable<BreadcrumbItem[]>;

    constructor(
        private store: Store<AppStore>
    ) { }

    ngOnInit() {
        this.items = this.store.select(s => s.breadcrumbs);
    }
}