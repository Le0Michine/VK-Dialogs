import { ModuleWithProviders }  from "@angular/core";
import { RouterModule, Routes }  from "@angular/router";
import { DialogComponent } from "./dialog";
import { DialogListComponent } from "./dialogs-list";
import { AppComponent } from "./app.component";
import { LoginComponent } from "./login";
import { AuthorizationGuard } from "./guards";

export function getSavedRoute() {
    let state = JSON.parse(localStorage.getItem("savedState"));
    return state && state.router && state.router.path ? decodeURI(state.router.path) : "/dialogs";
};

export const routes: Routes = [
  {
    path: "dialogs/:type/:id/:title",
    component: DialogComponent,
    canActivate: [ AuthorizationGuard ]
  },
  {
    path: "dialogs",
    component: DialogListComponent,
    canActivate: [ AuthorizationGuard ]
  },
  {
    path: "authorize",
    component: LoginComponent
  },
  {
    path: "",
    redirectTo: "/dialogs",
    pathMatch: "full"
  }
];
