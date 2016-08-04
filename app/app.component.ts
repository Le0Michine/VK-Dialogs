import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  templateUrl: 'app/app.component.html'
})
export class AppComponent { 
    title = "Dialogs";

    dialogName = "Nick";
    previewMessageAuthor = "You";
    previewMessageText = "Hi where";
    previewMessageTime = "9.15am";
    isPreviewMessageRead = false;
}
