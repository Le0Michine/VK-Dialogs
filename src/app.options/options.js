// Saves options to chrome.storage
function save_options() {
    var lang = document.getElementById("targetLangSel").value;
    var set_online = document.getElementById("set-online-checkbox").checked;
    // var show_typing = document.getElementById("show-typing-checkbox").checked;
    chrome.storage.sync.set({
        settings: {
            currentLang: lang,
            setOnline: set_online,
            // showTyping: show_typing,
            windowSize: document.getElementById("windowSize").value,
            stickerSize: document.getElementById("stickerSize").value,
            // activatePreviewFeatures: document.getElementById("activatePreviewFeatures").checked,
            autoReadMessages: document.getElementById("autoReadMessages").checked
        }
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('saveStatus');

        status.style.display = "";
        status.style.transition = "opacity 0.4s ease-out";
        status.style.opacity = "1";
        setTimeout(function() {
            status.style.transition = "opacity 0.4s ease-out";
            status.style.opacity = "0";
        }, 1000);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({ settings: {
        "currentLang": "ru",
        "setOnline": true,
        "showTyping": true,
        "windowSize": "medium",
        "stickerSize": "large",
        "activatePreviewFeatures": false,
        "autoReadMessages": true
    } }, function(items) {
        console.log("got settings: ", items);
        document.getElementById("targetLangSel").value = items.settings.currentLang;
        document.getElementById("set-online-checkbox").checked = items.settings.setOnline;
        // document.getElementById("show-typing-checkbox").checked = items.settings.showTyping;
        document.getElementById("windowSize").value = items.settings.windowSize;
        document.getElementById("stickerSize").value = items.settings.stickerSize;
        // document.getElementById("activatePreviewFeatures").checked = items.settings.activatePreviewFeatures;
        document.getElementById("autoReadMessages").checked = items.settings.autoReadMessages;
    });
}

function onload() {
    restore_options();
    updateLocale();
    console.dir(document.getElementById('saveBtn'));
    document.getElementById('saveBtn').addEventListener('click', save_options);
    document.getElementById('resetBtn').addEventListener('click', restore_options);
}

function updateLocale() {
    document.getElementById("logo_title").innerText = chrome.i18n.getMessage("chromeExtOptions");
    // document.getElementById("options-title-heading").innerText = chrome.i18n.getMessage("chromeExtOptions");
    document.getElementById("lang-option").innerText = chrome.i18n.getMessage("langOptions");
    document.getElementById("privacy-option").innerText = chrome.i18n.getMessage("privacyOptions");
    document.getElementById("set-online-checkbox-label").innerText = chrome.i18n.getMessage("setOnlineOption");
    // document.getElementById("show-typing-checkbox-label").innerText = chrome.i18n.getMessage("showTypingOption");
    document.getElementById("window-size-option").innerText = chrome.i18n.getMessage("windowSizeOption");
    document.getElementById("sticker-size-option").innerText = chrome.i18n.getMessage("stickerSizeOption");
    document.getElementById("autoread-option").innerText = chrome.i18n.getMessage("autoreadOption");
    document.getElementById("autoReadMessagesLabel").innerText = chrome.i18n.getMessage("autoReadMessagesLabel");
    // document.getElementById("preview-option").innerText = chrome.i18n.getMessage("previewOption");
    // document.getElementById("activatePreviewFeaturesLabel").innerText = chrome.i18n.getMessage("activatePreviewFeaturesLabel");
    document.getElementById("saveStatus").innerText = chrome.i18n.getMessage("optionsSaved");
    document.getElementById("saveBtn").innerText = chrome.i18n.getMessage("saveBtn");
    document.getElementById("resetBtn").innerText = chrome.i18n.getMessage("resetBtn");
}

document.addEventListener('DOMContentLoaded', onload);
console.dir(document.getElementById('saveBtn'));