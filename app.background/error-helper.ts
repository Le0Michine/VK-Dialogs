import { AuthHelper } from './auth-helper';

export class ErrorHelper {
    static checkErrors(json): number {
        if (json.error) {
            console.log('error oqured during response: ' + JSON.stringify(json));
            let code: number = json.error.error_code;
            switch (code) {
                case 5: // problems with authorization need to get new access_token
                    console.log('authorization issue, trying to reset session');
                    AuthHelper.clearSession();
                    AuthHelper.authorize(false);
                    break;
            }
            return code;
        }
        return 0;
    }
}