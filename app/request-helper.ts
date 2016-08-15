import { Observable } from 'rxjs/Rx'

export class RequestHelper {
    public static sendRequestToBackground(request: any): Observable<any> {
        console.log('request: ' + request.name);
        let result = Observable.bindCallback((callback: (response: any) => void) => {
            chrome.extension.sendRequest(
                request,
                (response: any) => {
                    console.log('response obtained for request: ' + request.name);
                    callback(response.data);
                }
            );
        });
        return result();
    }
}