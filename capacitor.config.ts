import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iesvra.app',
  appName: 'IESVRA Boutique',
  webDir: 'public/mobile-app',
  server: {
    url: 'https://www.iesvra.com/mobile-app/index.html',
    cleartext: true
  }
};

export default config;
