System.import('app.background').catch(function(err){ console.error(err); });

if (!window.localStorage.getItem("not_first_time")) {
    window.localStorage.setItem("not_first_time", true);
    chrome.tabs.create({
        url: "install.html",
        selected: true
    });
}