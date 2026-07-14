import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iesvra.app',
  appName: 'IESVRA Boutique',
  webDir: 'public/mobile-app',
  // server: {
  //   url: 'https://www.iesvra.com/mobile-app/index.html',
  //   cleartext: true
  // },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '825754182940-32tep8cm2tku2cdpfmd29adhn8q8j4du.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
