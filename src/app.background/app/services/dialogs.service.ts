import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Observer, Subject } from 'rxjs/Rx';
import * as _ from 'lodash';

import { DialogListFilterInfo, UserInfo, SingleMessageInfo, ChatInfo, HistoryInfo, DialogInfo, DialogListInfo, InputMessageInfo } from '../datamodels';
import { DialogShortInfo, HistoryListInfo, InputMessageState } from '../datamodels';
import { VKService } from './vk-service';
import { UserService } from './user-service';
import { LPSService } from './lps-service';
import { ChromeAPIService } from './chrome-api-service';
import { Channels } from '../../../app.shared/channels';
import { updateDialogList, updateDialogListUnread, updateDialogListFilter, sendMessageSuccess, sendMessageFail, typeMessage, sendMessagePending, restoreInputMessages } from '../actions';
import { UsersActions, HistoryActions, DialogListActions, ChatsActions, AppBackgroundState } from '../app-background.store';
import { VKUtils } from '../vk-utils';

@Injectable()
export class DialogService {
    private getDialogsApiMethod = 'messages.getDialogs';
    private getHistoryApiMethod = 'messages.getHistory';
    private getChatApiMethod = 'messages.getChat';
    private getMessageApiMethod = 'messages.getById';
    private sendMessageApiMethod = 'messages.send';
    private markAsReadApiMethod = 'messages.markAsRead';
    private searchDialogsApiMethod = 'messages.searchDialogs';

    private openedConversations: any[] = [];
    private initialized = false;
    private dialogListFilter: DialogListFilterInfo = {} as DialogListFilterInfo;

    private dialogsCount = 20;

    private maxDialogsCount: number;

    constructor(
        private store: Store<AppBackgroundState>,
        private vkservice: VKService,
        private userService: UserService,
        private lpsService: LPSService,
        private chromeapi: ChromeAPIService
    ) { }

    init(): void {
        if (this.initialized) {
            console.warn('dialog service already initialized');
            return;
        }
        this.initialized = true;
        this.chromeapi.onUnsubscribe
            .filter((sub: any) => sub.name.includes('history_update'))
            .subscribe((sub: any) => {
                console.log('unsubscribe from history_update: ', sub);
                const i = this.openedConversations.findIndex(x => 'history_update_' + x.conversation_id === sub.name);
                if (i > -1) {
                    this.openedConversations.splice(i, 1);
                }
        });

        this.lpsService.messageUpdate.subscribe(() => this.updateMessages());
        this.lpsService.resetHistory.subscribe(() => {
            console.log('reset history');
            this.updateMessages();
        });

        this.getDialogs();

        this.chromeapi.onSubscribe.filter((s: string) => /^history_update_.+$/.test(s)).subscribe((s: string) => {
            console.log('subscribe on history update', s);
            const parts = s.split('_');
            const id = +parts[parts.length - 2];
            const isChat = parts[parts.length - 1] === 'true' ? true : false;
            const openedConversation = {
                messages_count: 20,
                conversation_id: id,
                is_chat: isChat
            };
            if (this.openedConversations.findIndex(x => x.conversation_id === openedConversation.conversation_id) < 0) {
                this.openedConversations.push(openedConversation);
            }

            this.getHistory(openedConversation.conversation_id, openedConversation.is_chat).subscribe(history => {
                if (history) {
                    this.store.dispatch({ type: HistoryActions.HISTORY_UPDATED, payload: history });
                    this.loadUsersFromMessages(history.messages);
                }
                if (openedConversation.is_chat) {
                    this.getChatParticipants(openedConversation.conversation_id);
                }
            },
            error => this.handleError(error));
        });

        this.chromeapi.OnMessage(Channels.loadOldMessagesRequest).subscribe((message: any) => {
            const conversation = this.openedConversations.find(c => c.conversation_id === message.id);
            console.log('load old messages for: ', conversation);
            this.loadOldMessages(conversation);
        });

        this.chromeapi.OnDisconnect().subscribe(() => {
            this.dialogsCount = 20;
        });

        this.chromeapi.OnPortMessage(Channels.loadOldDialogsRequest).subscribe(() => {
            this.loadOldDialogs();
        });

        this.chromeapi.OnMessage('search_dialog').subscribe((message) => {
            this.searchDialogs(message.data).subscribe(result => {
                console.log('got search result', result);
                message.sendResponse({ data: result });
            });
            return true;
        });

        this.store.select(s => s.inputMessages)
            .map(m => m.conversationIds.map(i => m.messages[i]).filter(i => i.state === InputMessageState.SENDING))
            .filter(m => m.length > 0)
            .subscribe(messages => {
                messages.forEach(m => this.sendMessage(m));
            });

        chrome.storage.sync.get({ 'input_messages': [] }, (items: InputMessageInfo[]) => {
            console.log('restored messages', items);
            this.store.dispatch(restoreInputMessages(items['input_messages'] || []));
        });

        this.store.select(s => s.inputMessages)
            .map(m => m.conversationIds.map(i => m.messages[i]).filter(i => i.state !== InputMessageState.SENDING))
            .filter(m => m.length > 0)
            .debounceTime(10000)
            .subscribe(messages => {
                chrome.storage.sync.set({ 'input_messages': messages });
            });

        this.chromeapi.OnPortMessage('send_message').subscribe((message: any) => {
            this.store.dispatch(sendMessagePending(message.data));
        });

        this.chromeapi.OnPortMessage('type_message')
            .map(m => m.data)
            .distinctUntilChanged((m1, m2) => JSON.stringify(m1) === JSON.stringify(m2))
            .filter((m: InputMessageInfo) => m.state !== InputMessageState.SENDING)
            .subscribe((message: any) => {
                this.store.dispatch(typeMessage(message));
            });

        this.chromeapi.OnPortMessage('set_dialog_list_filter')
            .map(m => m.data)
            .subscribe((f: DialogListFilterInfo) => {
                this.store.dispatch(updateDialogListFilter(f));
            });

        this.store.select(s => s.dialogsFilter).subscribe(f => {
            this.dialogListFilter = f;
            this.getDialogs(20, null, f.unread);
        })
    }

    monitorCurrentMessage(): void {
        let key = null;
        const currentMessage = {};

        const save = () => {
            if (key) {
                if (currentMessage[key].text || currentMessage[key].attachments) {
                    console.log('update message: ', currentMessage);
                    chrome.storage.sync.set(currentMessage);
                } else {
                    console.log('remove message: ', currentMessage);
                    chrome.storage.sync.remove(key);
                }
            }
        };

        const subscription = Observable.interval(10000)
            .map(x => currentMessage)
            .distinct(x => x[key])
            .subscribe(() => {
                console.log('store current message: ', currentMessage);
                save();
        });

        const sub = this.chromeapi.OnPortMessage('current_message').subscribe(message => {
            key = message.key;
            currentMessage[key] = {};
            currentMessage[key].text = message.text;
            currentMessage[key].attachments = message.attachments;
            if (message.is_last) {
                console.log('last message, unsubscribe');
                subscription.unsubscribe();
                save();
                sub.unsubscribe();
            }
        });

        const onDisconnect = this.chromeapi.OnDisconnect().subscribe(() => {
            console.log('port disconnected, unsubscribe current_message');
            onDisconnect.unsubscribe();
            sub.unsubscribe();
            subscription.unsubscribe();
            save();
        });
    }

    updateMessages(): void {
        console.log('update messages');
        this.getDialogs();

        for (const conv of this.openedConversations) {
            this.getHistory(conv.conversation_id, conv.is_chat).subscribe(history => {
                    if (!history) {
                        return;
                    }
                    this.store.dispatch({ type: HistoryActions.HISTORY_UPDATED, payload: history });
                    this.loadUsersFromMessages(history.messages);
                },
                error => this.handleError(error)
            );
        }
    }

    loadDialogUsers(dialogs: DialogListInfo): void {
        this.store.select(s => s.dialogs).first().subscribe((ds: DialogListInfo) => {
            const users = [];
            for (const dialog of ds.dialogs) {
                users.push(dialog.message.userId, dialog.message.fromId);
                if (dialog.message.fwdMessages) {
                    users.push(...dialog.message.fwdMessages.map(fwd => fwd.userId));
                }
            }
            this.userService.loadUsers(users.join());
            const chats = ds.dialogs.filter(d => d.message.chatId ? true : false).map(c => c.message.chatId);
            this.getChats(chats.join());
        });
    }

    loadUsersFromMessages(messages: SingleMessageInfo[]): void {
        let ids: any = messages
                .map(msg => msg.fwdMessages ?
                    [msg.userId].concat(msg.fwdMessages.map(m => m.userId)) :
                    [msg.userId]).concat() as number[][];
        /** deflate */
        ids = [].concat.apply([], ids) as number[];
        /** distinct */
        ids = ids.filter((value, i, self) => self.indexOf(value) === i);
        this.store.select(s => s.users).subscribe(users => {
            ids = ids.filter((value, i, self) => users.userIds.indexOf(value) === -1);
            this.userService.loadUsers(ids.join());
        });
    }

    private getUserIdsFromAttachments(message: SingleMessageInfo) {

    }

    getDialogs(count: number = 20, fromId: number = null, getUnread: boolean = false): void {
        console.log('dialogs are requested');
        const parameters = { count };
        if (fromId) {
            parameters['start_message_id'] = fromId;
        }
        parameters['unread'] = this.dialogListFilter.unread ? 1 : 0;
        parameters['unanswered'] = this.dialogListFilter.unanswered ? 1 : 0;
        parameters['important'] = this.dialogListFilter.important ? 1 : 0;
        this.vkservice.performAPIRequestsBatch(
            this.getDialogsApiMethod,
            parameters
        ).map(json => this.toDialogsInfo(json))
        .subscribe(dialogList => {
            if (this.dialogListFilter.unread) {
                dialogList.unread = dialogList.count;
                this.store.dispatch(updateDialogListUnread(dialogList));
            } else {
                this.store.dispatch(updateDialogList(dialogList));
            }
            this.loadDialogUsers(dialogList);
        });
    }

    getHistory(id: number, chat: boolean, count: number = 20, fromId: number = null): Observable<HistoryInfo> {
        console.log('history is requested. id:' + id + ', chat:' + chat + ', cout:' + count + ', from_id:' + fromId);
        const parameters = { count: count, rev: 0 };
        parameters['peer_id'] = id;
        if (fromId) {
            parameters['start_message_id'] = fromId;
        }
        return this.vkservice.performAPIRequestsBatch(this.getHistoryApiMethod, parameters)
            .map(json => this.toHistoryViewModel(json));
    }

    getChatParticipants(chatId: number): void {
        console.log('chat participants requested');
        this.vkservice.performAPIRequestsBatch(this.getChatApiMethod, { chat_ids: chatId, fields: 'photo_50,online,sex' })
            .map(json => this.userService.toUsersList(json))
            .subscribe(users => this.store.dispatch({ type: UsersActions.USERS_UPDATED, payload: users }));
    }

    getChats(chatIds: string): void {
        console.log('chats requested', chatIds);
        this.vkservice.performAPIRequestsBatch(this.getChatApiMethod, { chat_ids: chatIds, fields: 'photo_50,online,sex' })
            .map(json => this.toChatList(json))
            .subscribe(chats => this.store.dispatch({ type: ChatsActions.CHATS_UPDATED, payload: chats }));
    }

    markAsRead(ids: string): Observable<number> {
        console.log('mark as read message(s) with id: ' + ids);
        return this.vkservice.performAPIRequestsBatch(this.markAsReadApiMethod, { message_ids: ids });
    }

    searchDialogs(searchTerm: string): Observable<DialogShortInfo[]> {
        console.log('search dialogs', searchTerm);
        return this.vkservice.performAPIRequestsBatch(
            this.searchDialogsApiMethod,
            { q: searchTerm, limit: 10 }
        ).map(r => this.toDialogsShort(r));
    }

    private sendMessage(message: InputMessageInfo): void {
        console.log('sending message', message);
        const parameters = { message: message.body, attachment: message.attachments.map(x => x.id).join() };
        parameters['peer_id'] = message.peerId;
        this.vkservice.performAPIPostRequest(this.sendMessageApiMethod, parameters)
            .subscribe(messageId => {
                this.store.dispatch(messageId ? sendMessageSuccess(message.peerId) : sendMessageFail(message.peerId));
            });
    }

    private loadOldDialogs(): void {
        if (this.dialogsCount >= this.maxDialogsCount) {
            console.log('all dialogs are loaded');
            return;
        }
        console.log('load old dialogs');

        this.store.select(s => s.dialogs).first().subscribe((dialogList: DialogListInfo) => {
            const lastDialogId = dialogList.dialogs[dialogList.dialogs.length - 1].message.id;
            this.getDialogs(20, lastDialogId);
        });
    }

    private loadOldMessages(conversation): void {
        console.log('load old messages');
        this.store.select(s => s.history).first().subscribe((historyList: HistoryListInfo) => {
            const messages = historyList.history[conversation.conversation_id].messages;
            this.getHistory(conversation.conversation_id, conversation.is_chat, 20, messages[messages.length - 1].id)
                .subscribe(history => {
                    if (!history) {
                        return;
                    }
                    this.store.dispatch({ type: HistoryActions.HISTORY_UPDATED, payload: history });
                    this.loadUsersFromMessages(history.messages);
                },
                error => this.handleError(error),
                () => console.log('old messages loaded')
            );
        });
    }

    private toDialogsShort(json): DialogShortInfo[] {
        const dialogs: DialogShortInfo[] = [];
        for (const x of json) {
            const dialog = new DialogShortInfo();
            dialog.id = VKUtils.getPeerId(x.id, x.type === 'chat' ? x.id : 0);
            dialog.title = x.title || x.first_name + ' ' + x.last_name;
            dialog.type = x.type;
            dialogs.push(dialog);
        }
        return dialogs;
    }

    private toChatList(json): ChatInfo[] {
        return json.map(jsonChat => this.toChatViewModel(jsonChat));
    }

    private toHistoryViewModel(json): HistoryInfo {
        const messages = json.items.map(x => this.toSingleMessageViewModel(x));
        return {
            count: json.count,
            messages: messages,
            peerId: messages.length ? messages[0].peerId : 0,
            isChat: messages.length && messages[0].chatId ? true : false,
            conversationTitle: messages.length ? messages[0].title : ''
        };
    }

    private toChatViewModel(json): ChatInfo {
        return {
            adminId: json.admin_id,
            id: json.id,
            title: json.title,
            users: json.users.map(u => this.userService.toUserViewModel(u)),
            type: json.type
        };
    }

    private toSingleMessageViewModel(json): SingleMessageInfo {
        const message: SingleMessageInfo = {
            id: json.id,
            peerId: VKUtils.getPeerId(json.user_id, json.chat_id),
            action: json.action,
            actionMid: json.action_mid,
            attachments: this.toAttachmentsViewModel(json.attachments || [], json.geo),
            body: json.body,
            userId: json.user_id,
            chatId: json.chat_id,
            date: json.date,
            fromId: json.from_id || (json.out ? this.vkservice.getCurrentUserId() : json.user_id),
            fwdMessages: json.fwd_messages ? json.fwd_messages.map(x => this.toSingleMessageViewModel(x)) : null,
            isRead: !!json.read_state,
            out: !!json.out,
            photo50: json.photo_50,
            title: json.title
        };
        return message;
    }

    private toAttachmentsViewModel(jsonAttachments: any[], jsongeo: any): any {
        if (jsongeo) {
            jsonAttachments.push(Object.assign({ geo: jsongeo }, { type: 'geo' }));
        }
        return jsonAttachments;
    }

    private toDialogViewModel(json): DialogInfo {
        return {
            unreadCount: json.unread,
            message: this.toSingleMessageViewModel(json.message)
        };
    }

    private toDialogsInfo(json): DialogListInfo {
        return {
            dialogs: json.items.map(x => this.toDialogViewModel(x)),
            count: json.count,
            unread: json.unread_dialogs
        };
    }

    private handleError(error: any): void {
        console.error('An error occurred in background-dialog-service: ', error);
    }
}
