import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';

import { BreadcrumbItem } from '../datamodels';
import { AppState } from '../app.store';

@Component({
    selector: 'app-breadcrumb',
    templateUrl: 'breadcrumb.component.html',
    styleUrls: [
        './breadcrumb.component.scss'
    ]
})
export class BreadcrumbComponent implements OnInit {
    items: Observable<BreadcrumbItem[]>;

    constructor(
        private store: Store<AppState>
    ) { }

    ngOnInit() {
        this.items = this.store.select(s => s.breadcrumbs);
    }
}
