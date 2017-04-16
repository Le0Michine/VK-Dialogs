import { Action } from '@ngrx/store';

import { SelectedConversationActions } from '../reducers';
import { SelectedConversation } from '../datamodels';

export function selectConversation(title: string, peerId: number): Action {
    return { type: SelectedConversationActions.UPDATED, payload: { title, peerId } };
}

export function closeSelectedConversation(): Action {
    return { type: SelectedConversationActions.UPDATED, payload: { } };
}
