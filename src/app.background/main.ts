import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { VersionComparerUtil } from '../app.shared/utils/version-comparer.util';
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

  if (VersionComparerUtil.compareVersions(lastInstalledVersion || '0.0.0.0', '2.6.4.13') <= 0) {
    localStorage.removeItem('savedState');
  }

  if (!lastInstalledVersion) {
    firstInstall();
  }

  localStorage.setItem(currentVersionKey, currentVersion);

  openReleaseNotes();
}

function openReleaseNotes() {
  console.log('open tab describing new version');
}

function firstInstall() {
  chrome.tabs.create({
      url: 'install.html',
      active: true
  });
}
