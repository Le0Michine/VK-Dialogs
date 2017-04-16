export class OptionsViewHolder {
    targetLangSelect: HTMLSelectElement;
    setOnlineCheckbox: HTMLInputElement;
    windowSizeSelect: HTMLSelectElement;
    stickerSizeSelect: HTMLSelectElement;
    autoReadCheckbox: HTMLInputElement;
    showNotificationsCheckbox: HTMLInputElement;
    playNotificationSoundCheckbox: HTMLInputElement;
    notificationSound: HTMLSelectElement;

    saveButton: HTMLButtonElement;
    resetButton: HTMLButtonElement;
    playSoundButton: HTMLButtonElement;

    constructor(doc: HTMLDocument) {
        this.targetLangSelect = doc.getElementById('targetLangSel') as HTMLSelectElement;
        this.setOnlineCheckbox = doc.getElementById('set-online-checkbox') as HTMLInputElement;
        this.windowSizeSelect = doc.getElementById('windowSize') as HTMLSelectElement;
        this.stickerSizeSelect = doc.getElementById('stickerSize') as HTMLSelectElement;
        this.autoReadCheckbox = doc.getElementById('autoReadMessages') as HTMLInputElement;
        this.showNotificationsCheckbox = doc.getElementById('showNotifications') as HTMLInputElement;
        this.playNotificationSoundCheckbox = doc.getElementById('playNotificationSound') as HTMLInputElement;
        this.notificationSound = doc.getElementById('notificationSound') as HTMLSelectElement;

        this.saveButton = doc.getElementById('saveBtn') as HTMLButtonElement;
        this.resetButton = doc.getElementById('resetBtn') as HTMLButtonElement;
        this.playSoundButton = doc.getElementById('playSoundBtn') as HTMLButtonElement;
    }
}
