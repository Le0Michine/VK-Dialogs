import { ModuleWithProviders }  from "@angular/core";
import { RouterModule, Routes }  from "@angular/router";
import { DialogComponent } from "./dialog";
import { DialogListComponent } from "./dialogs-list";
import { AppComponent } from "./app.component";
import { LoginComponent } from "./login";
import { AuthorizationGuard } from "./guards";

const routes: Routes = [
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
  },
  {
    path: "popup.html",
    redirectTo: "/dialogs",
    pathMatch: "full"
  }
];

export const routing: ModuleWithProviders = RouterModule.forRoot(routes, { useHash: true });
