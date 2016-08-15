import { Observable } from 'rxjs/Rx';

export class ObservableExtension {
    static resolveOnValue(value: any): Observable<any> {
        let res = Observable.bindCallback((callback: (x: any) => void) => callback(value));
        return res();
    }
}