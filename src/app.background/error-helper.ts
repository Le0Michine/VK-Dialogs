import { AuthHelper } from "./auth-helper";

export class ErrorHelper {
    static checkErrors(json: any): number {
        if (json.error) {
            console.warn("error occured during response: ", JSON.stringify(json));
            let code: number = json.error.error_code;
            switch (code) {
                case 5: // problems with authorization need to get new access_token
                    console.log("authorization issue, trying to reset session");
                    AuthHelper.clearSession();
                    AuthHelper.authorize(true);
                    break;
                case 6:
                    console.warn("too many requests per second");
                    break;
                default:
                    console.error("unknown error", json);
                    break;
            }
            console.log("error code", code);
            return code;
        }
        return 0;
    }
}