import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";

@Injectable()
export class StateResolverService {
    private stateKey = "savedState";

    saveState(state: any) {
        localStorage.setItem(this.stateKey, JSON.stringify(state));
    }

    getState() {
        return Observable.of(JSON.parse(localStorage.getItem(this.stateKey)));
    }
}