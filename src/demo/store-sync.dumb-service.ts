import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";

@Injectable()
export class StoreSyncDumbService {
    subscribeOnHistory() {
        return Observable.create(observer => {
            // do nothing
        });
    }

    init() {
        // do nothing
     }
}