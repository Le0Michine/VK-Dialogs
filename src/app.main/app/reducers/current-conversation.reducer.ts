import { ActionReducer, Action } from '@ngrx/store';

import { SelectedConversation } from '../datamodels';

export class SelectedConversationActions {
    static UPDATED = 'CURRENT_CONVERSATION_ID_UPDATED';
}

export function selectedConversationReducer (state: number, action: Action): number {
    switch (action.type) {
        case SelectedConversationActions.UPDATED:
            return action.payload;
        default:
            return state;
    };
}
