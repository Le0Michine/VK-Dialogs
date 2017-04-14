import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from '../environments/environment';

performUpgrade();

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);

function performUpgrade() {
  const currentVersionKey = 'currentVersion';
  const lastInstalledVersion = localStorage.getItem(currentVersionKey);
  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;

  if (!lastInstalledVersion || lastInstalledVersion === '2.6.4.13') {
    localStorage.removeItem('savedState');
  }

  localStorage.setItem(currentVersionKey, currentVersion);

  openReleaseNotes();
}

function openReleaseNotes() {
  console.log('open tab describing new version');

  if (!window.localStorage.getItem('not_first_time')) {
    console.log('open tab describing new version');
    window.localStorage.setItem('not_first_time', 'true');
    chrome.tabs.create({
        url: 'install.html',
        active: true
    });
  }
}

