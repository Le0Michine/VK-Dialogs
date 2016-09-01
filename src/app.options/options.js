// Saves options to chrome.storage
function save_options() {
    var lang = document.getElementById("targetLangSel").value;
    chrome.storage.sync.set({
        currentLang: lang
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
    chrome.storage.sync.get({ "currentLang": "ru" }, function(items) {
        console.log("got settings: ", items);
        document.getElementById("targetLangSel").value = items.currentLang;
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
    document.getElementById("options-title-heading").innerText = chrome.i18n.getMessage("chromeExtOptions");
    document.getElementById("lang-option").innerText = chrome.i18n.getMessage("langOptions");
    document.getElementById("saveStatus").innerText = chrome.i18n.getMessage("optionsSaved");
    document.getElementById("saveBtn").innerText = chrome.i18n.getMessage("saveBtn");
    document.getElementById("resetBtn").innerText = chrome.i18n.getMessage("resetBtn");
}

document.addEventListener('DOMContentLoaded', onload);
console.dir(document.getElementById('saveBtn'));