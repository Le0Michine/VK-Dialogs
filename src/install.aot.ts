import { platformBrowser } from "@angular/platform-browser";
import { bootloader } from "@angularclass/hmr";
import { enableProdMode } from "@angular/core";
/*
 * App Module
 * our top level module that holds all of our components
 */
import { AppInstallModuleNgFactory } from "../aot/src/app.installguide/app.module.ngfactory";

/*
 * Bootstrap our Angular app with a top level NgModule
 */
export function main(): Promise<any> {
  enableProdMode();
  return platformBrowser()
    .bootstrapModuleFactory(AppInstallModuleNgFactory)
    .catch(err => console.error(err));
}

// needed for hmr
// in prod this is replace for document ready
bootloader(main);