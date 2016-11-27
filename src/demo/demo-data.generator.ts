import { BreadcrumbItem, HistoryListInfo, ChatListInfo, DialogListInfo, UserListInfo, InputMessageListInfo } from "../app/datamodels";
import { HistoryInfo, ChatInfo, DialogInfo, UserInfo, InputMessageInfo, SingleMessageInfo } from "../app/datamodels";

export function generateDemoData() {
    return {
        breadcrumbs: [],
        users: generateUsers(),
        dialogs: generateDialogs(),
        chats: new ChatListInfo(),
        history: generateHistory(),
        currentConversationId: -1,
        router: { path: "/dialogs" },
        inputMessages: new InputMessageListInfo()
    };
};

function generateUsers() {
    let users = new UserListInfo();
    users.userIds = [ 1, 2, 3, 4, 5 ];
    users.users = {
        1: createUser(1, "Bruce", "Wayne", "https://drslash.com/wp-content/uploads/2014/07/Batman5.png"),
        2: createUser(2, "James", "Bond", "https://lh3.googleusercontent.com/g5Ijq7cmkj-F7UT0J0yOJmZQ5y7gHeZaOxefaFFP6PjFUzGiZ3t8SjGQq0Q8wSsOiA=w300"),
        3: createUser(3, "Ivan", "Ivanov", "https://cdn2.iconfinder.com/data/icons/male-users-2/512/male_avatar20-512.png"),
        4: createUser(4, "Hilavitkutin", "", "https://cdn4.iconfinder.com/data/icons/user-avatar-flat-icons/512/User_Avatar-42-512.png"),
        5: createUser(5, "Jan", "Kowalski", "https://0.s3.envato.com/files/97977535/512/8_resize.png")
    };
    return users;
}

function createUser(id: number, firstName: string, lastName: string, avatarUrl: string) {
    let user = new UserInfo();
    user.firstName = firstName;
    user.lastName = lastName;
    user.id = id;
    user.photo50 = avatarUrl || "https:\/\/www.google.pl/url?sa=i&rct=j&q=&esrc=s&source=images&cd=&cad=rja&uact=8&ved=0ahUKEwj-q4eR6sjQAhXBFJoKHSBYC5cQjRwIBw&url=https%3A%2F%2Fopenclipart.org%2Ftags%2Fuser%2520icon&psig=AFQjCNHRVIKzY5U6EXp8XK34rxjRJHfuaQ&ust=1480332335323197";
    return user;
}

function generateDialogs() {
    let dialogs = new DialogListInfo();
    dialogs.count = 5;
    dialogs.unread = 1;
    dialogs.dialogs = [
        createDialog("Hi", 5),
        createDialog("Ke eca malcit gramatika sezononomo, ig kiu amen vatto. Sat deko kial lasta jh. Mega foren miloj po tri, vol de onjo propozicio sekvinbero, meze trafe respondvorto dev ju.", 4),
        createDialog("Um aus aremt Schiet d'Musek, ké gewëss d'Kirmes mat, wielen iweral derfir do mir.", 3),
        createDialog("My name is Bond, James Bond", 2),
        createDialog("I'm batman!", 1, 1)
    ];
    return dialogs;
}

function createDialog(body: string, id: number, unreadCount: number = 0) {
    let dialog = new DialogInfo();
    dialog.unreadCount = unreadCount;
    dialog.message = {
        body: body,
        conversationId: id,
        isRead: !unreadCount,
        title: " ... ",
        fromId: id,
        id: 123,
        date: Date.now() / 1000,
        out: false,
        userId: id
    } as SingleMessageInfo;
    return dialog;
}

function generateHistory() {
    let history = new HistoryListInfo();
    history.conversationIds = [ 1 ];
    history.history = {
        5: {
            conversationId: 5,
            conversationTitle: " ... ",
            count: 2,
            isChat: false,
            messages: [
                createMessage("Hi", 5, false),
                createMessage("Hi!", 1, true)
            ]
        }
    };
    return history;
}

function createMessage(body: string, fromId: number, out: boolean) {
    let message = new SingleMessageInfo();
    message.body = body;
    message.id = 12345;
    message.date = Date.now() / 1000;
    message.fromId = fromId;
    message.out = out;
    message.isRead = true;
    message.userId = fromId;
    return message;
}