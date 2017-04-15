import { UserInfo } from '../datamodels';

export class UserMapper {
    public static toUsersList(json: any[]): UserInfo[] {
        return json.map(userJson => UserMapper.toUserViewModel(userJson));
    }

    public static toUserViewModel(json: any): UserInfo {
        const user: UserInfo = {
            id: json.id,
            firstName: json.first_name,
            lastName: json.last_name,
            fullName: `${json.first_name} ${json.last_name}`,
            photo50: json.photo_50,
            photo100: json.photo_100,
            photo200: json.photo_200,
            isOnline: json.online,
            sex: json.sex
        };
        user.photo50 = json.photo_200;
        return user;
    }
}
