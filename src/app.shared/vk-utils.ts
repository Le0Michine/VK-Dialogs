export class VKUtils {
    public static getPeerId(userID: number, chatId: number): number {
        return chatId ? chatId + 2000000000 : userID;
    }

    public static getAvatarPlaceholder(): string {
        return chrome.extension.getURL('assets/images/camera_a.gif');
    }
}
