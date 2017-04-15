export class ChromeNotificationBuilder {
    private notification: chrome.notifications.NotificationOptions = {};

    public build(): chrome.notifications.NotificationOptions {
        return this.notification;
    }

    public addType(type: 'basic' | 'image' | 'list' | 'progress'): ChromeNotificationBuilder {
        this.notification.type = type;
        return this;
    }

    public addIconUrl(url: string): ChromeNotificationBuilder {
        this.notification.iconUrl = url;
        return this;
    }

    public addIconMaskUrl(url: string): ChromeNotificationBuilder {
        this.notification.appIconMaskUrl = url;
        return this;
    }

    public addTitle(title: string): ChromeNotificationBuilder {
        this.notification.title = title;
        return this;
    }

    public addMessage(message: string): ChromeNotificationBuilder {
        this.notification.message = message;
        return this;
    }

    public addContextMessage(contextMessage: string): ChromeNotificationBuilder {
        this.notification.contextMessage = contextMessage;
        return this;
    }

    public addPriority(priority: number): ChromeNotificationBuilder {
        this.notification.priority = priority;
        return this;
    }

    public addTimestamp(timestamp: number): ChromeNotificationBuilder {
        this.notification.eventTime = timestamp;
        return this;
    }

    public addButton(title: string, iconUrl: string): ChromeNotificationBuilder {
        if (!this.notification.buttons) {
            this.notification.buttons = [];
        }
        this.notification.buttons.push({ title, iconUrl });
        return this;
    }

    public addIsClickable(isClickable: boolean): ChromeNotificationBuilder {
        this.notification.isClickable = isClickable;
        return this;
    }

    public addRequireInteraction(requireInteraction: boolean): ChromeNotificationBuilder {
        (<any>this.notification).requireInteraction = requireInteraction;
        return this;
    }
}
