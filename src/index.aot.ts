import { platformBrowser } from "@angular/platform-browser";
import { bootloader } from "@angularclass/hmr";
import { enableProdMode } from "@angular/core";
/*
 * App Module
 * our top level module that holds all of our components
 */
import { AppModuleNgFactory } from "../compile/aot/src/app/app.module.ngfactory";

/*
 * Bootstrap our Angular app with a top level NgModule
 */
export function main(): Promise<any> {
  enableProdMode();
  return platformBrowser()
    .bootstrapModuleFactory(AppModuleNgFactory)
    .catch(err => console.error(err));
}

// needed for hmr
// in prod this is replace for document ready
bootloader(main);