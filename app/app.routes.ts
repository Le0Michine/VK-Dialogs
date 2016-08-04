import { provideRouter, RouterConfig }  from '@angular/router';
import { DialogComponent } from './dialog.component';
import { DialogsComponent } from './dialogs.component';
import { AppComponent } from './app.component';

const routes: RouterConfig = [
  {
    path: 'dialog/:id/:type',
    component: DialogComponent
  },
  {
    path: 'dialogs',
    component: DialogsComponent
  },
  {
    path: '',
    redirectTo: '/dialogs',
    pathMatch: 'full'
  }
];

export const appRouterProviders = [
  provideRouter(routes)
];
