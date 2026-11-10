import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.surita.router',
  appName: "Gabi's Router",
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
