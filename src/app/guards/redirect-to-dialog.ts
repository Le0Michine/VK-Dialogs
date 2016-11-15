import { Injectable } from "@angular/core";
import { CanActivate, Router, Resolve } from "@angular/router";
import { Store } from "@ngrx/store";
import { go, replace } from "@ngrx/router-store";

import { AppStore } from "../app.store";

@Injectable()
export class RedirectToDialog implements CanActivate {
    private redirected: boolean;

    constructor(private store: Store<AppStore>) { }

    getSavedRoute(): string {
        let state = JSON.parse(localStorage.getItem("savedState"));
        return state && state.router && state.router.path ? decodeURI(state.router.path) : "/dialogs";
    };

    canActivate() {
        let savedRoute = this.getSavedRoute();
        console.log("redirect to", savedRoute);
        if (savedRoute !== "/dialogs") {
            this.store.dispatch(replace(savedRoute));
        }
        return true;
    }
}