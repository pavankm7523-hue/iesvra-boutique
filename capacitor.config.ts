import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iesvra.app',
  appName: 'IESVRA',
  webDir: 'public/mobile-app',
  bundledWebRuntime: false,
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: 'YOUR_WEB_CLIENT_ID_PLACEHOLDER.apps.googleusercontent.com',
      androidClientId: 'YOUR_ANDROID_CLIENT_ID_PLACEHOLDER.apps.googleusercontent.com',
      iosClientId: 'YOUR_IOS_CLIENT_ID_PLACEHOLDER.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
