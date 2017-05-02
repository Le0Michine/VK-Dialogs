import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { VersionComparerUtil } from '../app.shared/utils/version-comparer.util';
import { environment } from '../environments/environment';

import { Settings } from '../app.shared/datamodels';

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

  if (VersionComparerUtil.compareVersions(lastInstalledVersion || '0.0.0.0', '2.8.0.32') <= 0) {
    localStorage.removeItem('savedState');
    overrideNotificationSettings();
    openReleaseNotes();
  }

  if (!lastInstalledVersion) {
    firstInstall();
  }

  localStorage.setItem(currentVersionKey, currentVersion);
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

function overrideNotificationSettings() {
  if (window.localStorage.getItem('settings')) {
    const settings: Settings = JSON.parse(window.localStorage.getItem('settings'));
    settings.playSoundNotifications = false;
    settings.showNotifications = false;
    window.localStorage.setItem('settings', JSON.stringify(settings));
    chrome.storage.sync.set({ 'settings': settings });
  }
}
