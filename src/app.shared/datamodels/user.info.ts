export interface UserInfo {
    id: number;
    firstName: string;
    lastName: string;
    isOnline: boolean;
    photo50: string;
    sex: UserSex;
}

export enum UserSex {
    undefined = 0,
    female = 1,
    male = 2
}
