export class SessionInfo {
    public userId: number;
    public accessToken: string;
    public tokenExp: number;
    public timestamp: number;

    public isExpired(): boolean {
        return false;
        // return Math.floor(Date.now() / 1000) - this.timestamp >= this.token_exp;
    }
}