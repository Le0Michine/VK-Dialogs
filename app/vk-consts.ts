export class VKConsts {
    public static auth_url: string = "https://oauth.vk.com/authorize?"; 
    public static redirect_uri: string = "https://oauth.vk.com/blank.html"; 
    public static client_id: number = 5573653; 
    public static scope: string = "messages,users,friends,status,offline"; 
    public static display: string = "page"; 
    public static response_type: string = "token"; 
    public static api_version: number = 5.53; 
    public static api_url: string = "https://api.vk.com/method/";

    public static vk_access_token_id: string = "vk_access_token"
    public static vk_user_id: string = "vk_user_id"
    public static vk_token_expires_in_id: string = "vk_token_expires_in"
    public static vk_permissions_id: string = "vk_permissions"
    public static vk_auth_timestamp_id: string = "vk_auth_timestamp"
}