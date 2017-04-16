import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { go } from '@ngrx/router-store';
import { TranslateService } from '../../../app.shared/translate';

import { VKService } from '../services';
import { AppState } from '../app.store';
import { BreadcrumbActions } from '../reducers';

@Component({
    selector: 'app-login',
    templateUrl: 'login.component.html',
    styleUrls: ['login.component.scss']
})
export class LoginComponent implements OnInit {
    constructor(
        private vkservice: VKService,
        private store: Store<AppState>,
        private translate: TranslateService
    ) { }

    ngOnInit() {
        this.translate.get('authorize_btn').subscribe(value => {
            this.store.dispatch({ type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: [{ title: value, navigationLink: '' }] });
        });
        if (this.vkservice.hasValidSession()) {
            this.store.dispatch(go(['dialogs']));
        }
    }

    authorize() {
        this.vkservice.auth().subscribe(() => {
            console.log('authorization completed, go to dialogs');
            this.store.dispatch(go(['dialogs']));
        });
    }
}
