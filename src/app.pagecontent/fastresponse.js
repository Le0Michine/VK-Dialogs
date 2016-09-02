/** body, title, user_name, user_photo */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

});
var messageHtml =
    '<div id="injected_div" class="dialog">'
    + '<div class="user_avatar_div">'
    +   '<img src="https://vk.com/images/camera_c.gif" class="user_avatar" />'
    + '</div>'
    + '<div class="dialog_div">'
    +   '<div class="dialog_title_div">'
    +     '<span class="dialog_title_span">{{dialog_title}}</span>'
    +   '</div>'
    +   '<div class="message_body">'
    +     '<span><span>{{dialog_sender}}</span>{{message_body}}</span>'
    +     '<span class="three_dots">...</span>'
    +   '</div>'
    + '</div>'
    +'</div>';
var div = document.createElement("div");
div.innerHTML = messageHtml;
div.onclick = () => div.style.display = "none";

document.body.appendChild(div);
setInterval(() => {
    //div.style.display = "none";
}, 50000);

chrome.notifications.create("hjgk77", {
    "iconUrl": "https://vk.com/images/camera_c.gif",
    "title": "chat 66",
    "message": "message body",
    "contextMessage": "context message",
    "priority": 1,
    "eventTime": Date.now() + 5000,
    "buttons": [{"title": "read"}, {"title": "close"}],
    "imageUrl": "https://vk.com/images/camera_c.gif",
    "progress": 67,
    "isClickable": true,
    "requireInteraction": true
});
