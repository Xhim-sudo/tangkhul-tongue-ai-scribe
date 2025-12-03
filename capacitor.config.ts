import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.076909660beb47aab1fd8fb9c9fdc236',
  appName: 'tangkhul-tongue-ai-scribe',
  webDir: 'dist',
  server: {
    url: 'https://07690966-0beb-47aa-b1fd-8fb9c9fdc236.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: false
    }
  }
};

export default config;
