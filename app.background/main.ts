import { bootstrap }    from '@angular/platform-browser-dynamic';
import { HTTP_PROVIDERS } from '@angular/http';

import { BackgroundComponent } from './background.component';

bootstrap(BackgroundComponent, [HTTP_PROVIDERS]);
