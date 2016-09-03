var locale = "ru";
chrome.storage.sync.get({ "currentLang": "ru" }, value => {
    locale = value.currentLang;
});

chrome.runtime.sendMessage({name: "notification"}, (response) => {
    var iframe = document.createElement('iframe');
    iframe.src="about:blank";
    iframe.onload = function() {
        var domdoc = iframe.contentDocument || iframe.contentWindow.document;
        var style = '<link rel="stylesheet" href="' + chrome.extension.getURL("app.pagecontent/notification.css") + '">';
        htmlStr = response;
        domdoc.body.innerHTML = response;
        domdoc.head.innerHTML = style;
        applyLocalization(domdoc);

        function hide() {
            iframe.classList.add("css-isolation-popup-hidden");
        }

        var closeBtn = domdoc.getElementById("closeBtn");
        closeBtn.onclick = hide;

        var input = domdoc.getElementById("message_input");

        /** body, title, user_name, user_photo, user_id, chat_id? */
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.dir(request);
            if (request.name === "notification" && request.body) {
                var sendBtn = domdoc.getElementById("sendBtn");
                var messageSent = false;
                fillForm(domdoc, request);
                sendBtn.onclick = () => {
                    if (messageSent) return;
                    sendResponse({ "text": input.value, "user_id": request.user_id, "chat_id": request.chat_id });
                    hide();
                };
                iframe.style.display = "block";

            }
            else if (request.locale) {
                locale = request.locale;
                applyLocalization(domdoc);
            }
        });
    }
    iframe.className = 'css-isolation-popup';
    iframe.frameBorder = 0;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
});

function fillForm(domdoc, info) {
    domdoc.getElementById("dialog_title").innerText = info.title;
    domdoc.getElementById("author").innerText = info.body;
    domdoc.getElementById("user_photo").src = info.user_photo;
}

function applyLocalization(domdoc) {
    domdoc.getElementById("sendBtn").innerText = chrome.i18n.getMessage("sendBtn");
    domdoc.getElementById("input_label").innerText = chrome.i18n.getMessage("typeHere");
}

/*console.dir(iframe);
console.dir(iframe.contentWindow);
console.dir(iframe.contentDocument);
console.dir(chrome.extension.getURL("app.pagecontent/notification.html"));
var closeBtn = iframe.contentDocument.getElementById("closeBtn");

console.dir(closeBtn);
/*
closeBtn.onclick = () => {
    iframe.classList.add("css-isolation-popup-hidden");
    alert("close");
};*/