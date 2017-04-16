import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';
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
export class BreadcrumbComponent implements OnInit, OnDestroy {
    private subscriptions: Subscription[] = [];
    public items: BreadcrumbItem[];

    constructor(
        private ref: ChangeDetectorRef,
        private store: Store<AppState>
    ) { }

    ngOnInit() {
        this.subscriptions.push(this.store.select(s => s.breadcrumbs).subscribe(x => {
            this.items = x;
            this.ref.detectChanges();
        }));
    }

    ngOnDestroy() {
        this.subscriptions.forEach(x => x.unsubscribe());
    }
}
