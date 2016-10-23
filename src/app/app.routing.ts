import { ModuleWithProviders }  from "@angular/core";
import { RouterModule, Routes }  from "@angular/router";
import { DialogComponent } from "./dialog";
import { DialogListComponent } from "./dialogs-list";
import { AppComponent } from "./app.component";
import { LoginComponent } from "./login";

const routes: Routes = [
  {
    path: "dialog/:id/:type/:title",
    component: DialogComponent
  },
  {
    path: "dialogs",
    component: DialogListComponent
  },
  {
    path: "authorize",
    component: LoginComponent
  },
  {
    path: "",
    redirectTo: "/dialogs",
    pathMatch: "full"
  },
  {
    path: "popup.html",
    redirectTo: "/dialogs",
    pathMatch: "full"
  }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes);
