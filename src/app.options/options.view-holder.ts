export class OptionsViewHolder {
    targetLangSelect: HTMLSelectElement;
    setOnlineCheckbox: HTMLInputElement;
    windowSizeSelect: HTMLSelectElement;
    stickerSizeSelect: HTMLSelectElement;
    autoReadCheckbox: HTMLInputElement;

    saveButton: HTMLButtonElement;
    resetButton: HTMLButtonElement;

    constructor(doc: HTMLDocument) {
        this.targetLangSelect = doc.getElementById('targetLangSel') as HTMLSelectElement;
        this.setOnlineCheckbox = doc.getElementById('set-online-checkbox') as HTMLInputElement;
        this.windowSizeSelect = doc.getElementById('windowSize') as HTMLSelectElement;
        this.stickerSizeSelect = doc.getElementById('stickerSize') as HTMLSelectElement;
        this.autoReadCheckbox = doc.getElementById('autoReadMessages') as HTMLInputElement;

        this.saveButton = doc.getElementById('saveBtn') as HTMLButtonElement;
        this.resetButton = doc.getElementById('resetBtn') as HTMLButtonElement;
    }
}
