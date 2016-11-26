import { Component } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Store } from "@ngrx/store";

import { BreadcrumbItem } from "../datamodels";
import { AppState } from "../app.store";

@Component({
    selector: "breadcrumb",
    templateUrl: "breadcrumb.component.html",
    styleUrls: [
        "../css/color-scheme.css",
        "./breadcrumb.component.css"
    ]
})
export class BreadcrumbComponent {
    items: Observable<BreadcrumbItem[]>;

    constructor(
        private store: Store<AppState>
    ) { }

    ngOnInit() {
        this.items = this.store.select(s => s.breadcrumbs);
    }
}