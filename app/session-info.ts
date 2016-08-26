export class SessionInfo {
    public user_id: string;
    public access_token: string;
    public token_exp: number;
    public timestamp: number;

    public isExpired(): boolean {
        return false;
        //return Math.floor(Date.now() / 1000) - this.timestamp >= this.token_exp;
    }
}