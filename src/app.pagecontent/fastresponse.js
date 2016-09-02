/** body, title, user_name, user_photo */
//chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

//});
var iframe = document.createElement('iframe');
iframe.src = chrome.extension.getURL("app.pagecontent/notification.html");
console.dir(iframe);
iframe.className = 'css-isolation-popup';
iframe.frameBorder = 0;
document.body.appendChild(iframe);

setInterval(() => {
    //div.style.display = "none";
}, 1000);
