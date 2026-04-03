import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bible365.app',
  appName: 'Bible 365',
  webDir: 'out',
  plugins: {
    StatusBar: {
      overlaysWebView: true
    }
  }
};

export default config;
