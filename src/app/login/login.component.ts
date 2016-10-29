import { Component } from "@angular/core";
import { Store } from "@ngrx/Store";
import { Router } from "@angular/router";
import { TranslateService } from "ng2-translate/ng2-translate";

import { VKService } from "../services";
import { AppStore } from "../app.store";
import { BreadcrumbActions } from "../reducers";

@Component({
    selector: "login",
    templateUrl: "login.component.html",
    styleUrls: [
        "login.component.css",
        "../css/color-scheme.css",
        "../css/font-style.css"
       ]
})
export class LoginComponent {
    constructor(
        private router: Router,
        private vkservice: VKService,
        private store: Store<AppStore>,
        private translate: TranslateService
    ) { }

    ngOnInit() {
        this.translate.get("authorize_btn").subscribe(value => {
            this.store.dispatch({ type: BreadcrumbActions.BREADCRUMBS_UPDATED, payload: [{ title: value, navigationLink: "" }] });
        });
    }

    authorize() {
        this.vkservice.auth().subscribe(() => {
            console.log("authorization completed, go to dialogs");
            this.router.navigate(["dialogs"]);
        });
    }
}