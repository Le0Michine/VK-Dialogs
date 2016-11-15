import { ModuleWithProviders }  from "@angular/core";
import { RouterModule, Routes }  from "@angular/router";
import { DialogComponent } from "./dialog";
import { DialogListComponent } from "./dialogs-list";
import { AppComponent } from "./app.component";
import { LoginComponent } from "./login";
import { AuthorizationGuard, RedirectToDialog } from "./guards";

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
    pathMatch: "full",
    canActivate: [ RedirectToDialog ]
  }
];
