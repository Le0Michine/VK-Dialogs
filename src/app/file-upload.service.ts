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

            let formData = new FormData();
            formData.append("file", file);

            this.performAjaxRequest(uploadUrl, formData)
                .subscribe(photo => {
                    console.log("file uploaded", photo);
                    let data = JSON.parse(photo.photo);
                    if (!data || !data.length) {
                        console.log("unable to upload file");
                        result.next("");
                    }
                    this.chromeapi.SendRequest({ name: "get_message_photo", data: photo })
                        .subscribe(responsePhoto => {
                            console.log("got photo", responsePhoto);
                            result.next(responsePhoto.data);
                        });
                });
        });

        return result;
    }

    private performAjaxRequest(url, requestData): Observable<any> {
        return Observable.bindCallback((onSuccess: any) => {
            $.ajax({
                url: url,
                type: "POST",
                data: requestData,
                cache: false,
                contentType: false,
                processData: false,
                success: (data, textStatus, jqXHR) => onSuccess(JSON.parse(data)),
                error: function(jqXHR, textStatus, errorThrown)
                {
                    console.log("ERRORS: " + textStatus);
                    onSuccess(textStatus);
                }
            });
        })();
    }
}