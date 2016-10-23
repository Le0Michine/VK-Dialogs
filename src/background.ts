import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { bootloader } from "@angularclass/hmr";
/*
 * App Module
 * our top level module that holds all of our components
 */
import { AppModule } from "./app.background";

/*
 * Bootstrap our Angular app with a top level NgModule
 */
export function main(): Promise<any> {
  return platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
}

// needed for hmr
// in prod this is replace for document ready
bootloader(main);

if (!window.localStorage.getItem("not_first_time")) {
    window.localStorage.setItem("not_first_time", "true");
    chrome.tabs.create({
        url: "install.html",
        selected: true
    });
}