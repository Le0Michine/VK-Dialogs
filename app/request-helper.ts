import { Observable } from 'rxjs/Rx'

export class RequestHelper {
    public static sendRequestToBackground(request: any): Observable<any> {
        console.log('request: ' + request.name);
        let result = Observable.bindCallback((callback: (response: any) => void) => {
            chrome.runtime.sendMessage(
                request,
                (response: any) => {
                    console.log('response obtained for request: ' + request.name); 
                    if (!response.data) {                   
                        console.log('response has incorrect format: ' + JSON.stringify(response));
                    }
                    callback(response.data);
                }
            );
        });
        return result();
    }
}