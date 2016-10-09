import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";

import { VKService } from "./vk-service";
import { ChromeAPIService } from "./chrome-api-service";

@Injectable()
export class FileUploadService {

    constructor(private vkservice: VKService, private chromeapi: ChromeAPIService) { }

    uploadFile(file): Observable<string>  {
        let result: Subject<string> = new Subject();
        this.chromeapi.SendRequest({ name: "get_file_server" }).subscribe(response => {
            let uploadUrl = response.data;

            var data = new FormData();
            data.append("file", file);

            this.performAjaxRequest(uploadUrl, data)
                .subscribe(photo => {
                    console.log("file uploaded", photo);
                    this.chromeapi.SendRequest({ name: "get_message_photo", data: photo })
                        .subscribe(response => {
                            console.log("got photo", response);
                            result.next(response.data);
                        });
                })
        });

        return result;
    }

    private performAjaxRequest(url, data): Observable<any> {
        return Observable.bindCallback((onSuccess: any) => {
            $.ajax({
                url: url,
                type: 'POST',
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                success: (data, textStatus, jqXHR) => onSuccess(JSON.parse(data)),
                error: function(jqXHR, textStatus, errorThrown)
                {
                    console.log('ERRORS: ' + textStatus);
                    onSuccess(textStatus);
                }
            });
        })();
    }
    //get_file_server
    //get_message_photo
}