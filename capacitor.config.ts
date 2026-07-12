import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iesvra.app',
  appName: 'IESVRA Boutique',
  webDir: 'public/mobile-app',
  server: {
    url: 'https://www.iesvra.com/mobile-app/index.html',
    cleartext: true
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '1056525141674-lhfocgctskjflc2oecmrc2i2b94fep9q.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
