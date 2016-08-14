import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Rx';;
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
    current_text: string;
    messages_cache_port: chrome.runtime.Port;
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
            
            this.restoreCachedMessages(id, isChat);

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
    
    restoreCachedMessages(id, isChat) {
        this.messages_cache_port = chrome.runtime.connect({name:'messages_cache'});
        let cachedMessage = window.localStorage.getItem('cached_message_' + id + isChat);
        if (cachedMessage && cachedMessage != "undefined") {
            this.clearLabelContent();
            this.current_text = cachedMessage;
        }
        this.resizeInputTextarea();
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
        return 'loading...'; 
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

    onKeyPress(event, value) {
        if (event.keyCode == 13 && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
        else {
            this.cacheCurrentMessage();
        }
    }

    resizeInputTextarea() {
        let addListener = (element, event, handler) => element.addEventListener(event, handler, false);
        let textarea = document.getElementById('message_input') as HTMLTextAreaElement;
        let outer_div = document.getElementById('input_box');
        let minHeight = 30;

        let resize = () => {
            if (!textarea.value) { /* if all the text was cut/deleted */
                textarea.style.height = minHeight+'px';    
            }
            else {
                textarea.style.height = 'auto';
                textarea.style.height = Math.max(textarea.scrollHeight+5, minHeight)+'px';
            }
            outer_div.style.height = textarea.style.height;
        }
        /* small timeout to get the already changed text */
        let delayedResize = () => { window.setTimeout(resize, 100); };

        addListener(textarea, 'change',  resize);
        addListener(textarea, 'cut',     delayedResize);
        addListener(textarea, 'paste',   delayedResize);
        addListener(textarea, 'drop',    delayedResize);
        addListener(textarea, 'keydown', delayedResize);

        /* need to set value immidiately before resizing */
        textarea.value = this.current_text;
        delayedResize();
    }

    cacheCurrentMessage() {
        this.messages_cache_port.postMessage({
            key: 'cached_message_' + this.conversation_id + this.is_chat,
            value: this.current_text
        });        
    }

    errorHandler(error) {
        console.error('An error occurred', error);
        return Promise.reject(error.message || error);
    }
}