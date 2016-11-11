import { Injectable } from "@angular/core";

@Injectable()
export class StateResolverService {
    private stateKey = "savedState";

    saveState(state: any) {
        localStorage.setItem(this.stateKey, JSON.stringify(state));
    }

    getState() {
        return JSON.parse(localStorage.getItem(this.stateKey));
    }
}