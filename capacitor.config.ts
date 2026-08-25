import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iesvra.app',
  appName: 'IESVRA',
  webDir: 'public/mobile-app',
  bundledWebRuntime: false,
  plugins: {
    SocialLogin: {
      providers: {
        google: true,
        apple: false,
        facebook: false,
        twitter: false,
      },
      logLevel: 1,
    },
  },
};

export default config;
