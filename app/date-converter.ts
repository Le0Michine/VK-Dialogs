export class DateConverter {
    static convertDateTime(unixtime: number) {
        let date = new Date(unixtime * 1000);
        let now = new Date();

        if (date.getDate() == now.getDate()
            && date.getMonth() == now.getMonth()
            && date.getFullYear() == now.getFullYear()) {
                return date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        }
        else if (date.getDate() == now.getDate() - 1
            && date.getMonth() == now.getMonth()
            && date.getFullYear() == now.getFullYear()) {
                return 'yesterday';
        }
        else if (date.getFullYear() == now.getFullYear()) {
            return DateConverter.getMonth(date.getMonth()) + ' ' + date.getDate();
        }
        return DateConverter.getMonth(date.getMonth()) + ' ' + date.getDate() + ' ' + date.getFullYear;
    }

    static getMonth(month: number) {
        switch (month) {
            case 1:
                return 'Jan';
            case 2:
                return 'Feb';
            case 3:
                return 'Apr';
            case 4:
                return 'Mar';
            case 5:
                return 'May';
            case 6:
                return 'Jun';
            case 7:
                return 'Jul';
            case 8:
                return 'Aug';
            case 9:
                return 'Sep';
            case 10:
                return 'Oct';
            case 11:
                return 'Nov';
            case 12:
                return 'Dec';
        }
    }
}