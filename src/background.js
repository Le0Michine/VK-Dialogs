System.import('app.background').catch(function(err){ console.error(err); });

/* chrome.runtime.onMessage.addListener((message) => {
    if (message.name === "notification" || message.locale) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, message);
        });
    }
});

setTimeout(() => {
    console.log("send notification");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        for (var tab of tabs) {
            chrome.tabs.sendMessage(tab.id, {
                name: "notification",
                body: "message body long",
                title: "Title",
                user_name: "User Name",
                user_photo: "https://vk.com/images/camera_c.gif",
                user_id: 234214231,
            });
        }
        //chrome.tabs.sendMessage(tabs[0].id, {name: "notification", html: client.responseText});
    });
}, 5000);

var client = new XMLHttpRequest();
client.open('GET', chrome.extension.getURL("app.pagecontent/notification.html"));
client.onreadystatechange = function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {name: "notification", html: client.responseText});
    });
    chrome.runtime.onMessage.addListener((message, sender, response) => {
        if (message.name === "notification") {
            response(client.responseText);
        }
    });
}
client.send(); */