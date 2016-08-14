import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Message } from './message'
import { User } from './user'
import { DialogService } from './dialogs-service'
import { UserService } from './user-service'
import { VKService } from './vk-service'

@Component({
    selector: 'messges',
    templateUrl: 'app/dialog.component.html',
    styleUrls: [
        'app/dialog.component.css',
        'app/dialog.component.input.css',
        'app/dialog.component.header.css'
    ]
})
export class DialogComponent { 
    title = "Dialog";
    participants: {} = {};
    user_id: string;
    history: Message[];
    is_chat: boolean;
    conversation_id: number;
    sub: any;

    constructor (
        private messagesService: DialogService,
        private vkservice: VKService, 
        private userService: UserService, 
        private route: ActivatedRoute) { }

    ngOnInit() {
        this.user_id = this.vkservice.getSession().user_id;
        this.sub = this.route.params.subscribe(params => {
            this.title = params['title'];
            let id = +params['id'];
            let type = params['type'];
            let participants = params['participants'];
            let isChat: boolean = type === 'dialog' ? false : true;
            this.is_chat = isChat;
            this.conversation_id = id;

            this.updateHistory();

            if (isChat) {
                this.messagesService.getChatParticipants(id).subscribe(
                    users => { this.participants = users; },
                    error => this.errorHandler(error),
                    () => console.log('chat participants loaded'));
            }
            else {
                this.userService.getUsers(participants).subscribe(
                    users => { this.participants = users; },
                    error => this.errorHandler(error),
                    () => console.log('dialog participants loaded'));
            } 
        });
    }

    ngOnDestroy() {
        console.log('specific dialog component destroy');
        this.sub.unsubscribe();
    }

    updateHistory() {
        this.messagesService.getHistory(this.conversation_id, this.is_chat).subscribe(
            m => { this.history = m; },
            error => this.errorHandler(error),
            () => console.log('history loaded'));
    }

    goBack() {
        window.history.back();
    }

    getUserName(uid: number) {
        if (this.participants && this.participants[uid]) {
            return this.participants[uid].first_name;
        }
        return 'undefined'; 
    }

    getUserPhoto(uid: number) {
        if (this.participants && this.participants[uid] && this.participants[uid].photo_50) {
            return this.participants[uid].photo_50;
        }
        return 'http://vk.com/images/camera_c.gif';
    }

    clearLabelContent() {
        let label = document.getElementById('input_label');
        label.innerText = '';
    }

    sendMessage() {
        let textarea = document.getElementById('message_input') as HTMLTextAreaElement;
        let text = textarea.value.trim().replace(/\r?\n/g, "%0A");
        if (!text || text === '') {
            console.log('message text is empty, nothing to send');
            return;
        }
        this.messagesService.sendMessage(this.conversation_id, text, this.is_chat).subscribe(
            message => console.log(JSON.stringify(message)),
            error => this.errorHandler(error),
            () => { console.log('message sent'); textarea.value = ''; this.updateHistory(); });
    }

    onKeyPress(keyCode: number) {
        if (keyCode == 13 /* enter */) {
            //this.sendMessage();
        }
    }

    onKeyUp(event) {
        if (event.keyCode == 13) {
            let textarea = document.getElementById('message_input') as HTMLTextAreaElement;
            var content = textarea.value;  
            var caret = textarea.selectionStart;
            if(event.shiftKey){
                //textarea.value = content.substring(0, caret - 1) + "\n" + content.substring(caret, content.length);
                //textarea.selectionStart = caret + 1;
                //event.stopPropagation();
            } else {
                //textarea.value = content.substring(0, caret - 1) + content.substring(caret + 1, content.length);
                //this.sendMessage();
                //event.stopPropagation();
            }
        }
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}