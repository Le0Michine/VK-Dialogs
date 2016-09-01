/** body, title, user_name, user_photo */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

});
var messageHtml =
    '<div id="injected_div" class="dialog_li">'
    + '<div class="user_avatar_div">'
    +   '<img src="https://vk.com/images/camera_c.gif" class="user_avatar" />'
    + '</div>'
    + '<div class="dialog_div">'
    +   '<div class="dialog_content_div">'
    +     '<div class="dialog_title_div">'
    +       '<span class="dialog_title_span">{{dialog_title}}</span>'
    +     '</div>'
    +     '<div class="message_body">'
    +       '<span><span>{{dialog_sender}}</span>{{message_body}}</span>'
    +       '<span class="three_dots">...</span>'
    +     '</div>'
    +   '</div>'
    + '</div>';
//var user_photo = '<div><img src="https://vk.com/images/camera_c.gif" class="user_avatar" /></div>';
//var html = '<div id="injected_div">' + user_photo + '</div>';
var div = document.createElement("div");
div.innerHTML = messageHtml;

document.body.appendChild(div);
setInterval(() => {
    //div.style.display = "none";
}, 50000);


