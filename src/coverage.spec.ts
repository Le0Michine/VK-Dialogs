interface Window { __env__: any; }
window.__env__ = window.__env__ || {};

if (window.__env__["FULL_COVERAGE"]) {
    require("./app/dialog");
    require("./app/dialogs-list");
    require("./app/emoji");
    require("./app/login");
    require("./app/pipes");
    require("./app/popup-menu");
    require("./app/search");
    require("./app/services");
    require("./app.background/services");
    require("./app.background/reducers");
}