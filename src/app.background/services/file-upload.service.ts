import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";

import { VKService } from "./vk-service";

@Injectable()
export class FileUploadService {

    private getServerMethod: string = "photos.getMessagesUploadServer";
    private savePhotoMethod: string = "photos.saveMessagesPhoto";


    constructor(private vkservice: VKService) { }

    getServerUrl(): Observable<string> {
        return this.vkservice.performAPIRequestsBatch(this.getServerMethod, null)
            .map(response => {
                console.log("server url", response);
                return response.upload_url;
            });
    }

    getPhoto(photo: Photo): Observable<string> {
        return this.vkservice.performAPIRequestsBatch(this.savePhotoMethod, {photo: photo.photo, server: photo.server, hash: photo.hash})
            .map(response => {
                console.log("got photo to send", response);
                return `photo${response[0].owner_id}_${response[0].id}`;
            });
    }
}

class Photo {
    photo: string;
    server: number;
    hash: string;
}