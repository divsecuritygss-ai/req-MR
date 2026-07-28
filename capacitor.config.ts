import { CapacitorConfig } from '@capacitor/cli';

const APP_ID = 'com.company.meetinghub';
const APP_NAME = 'Meeting Room Hub';
const VERCEL_LIVE_URL = 'https://your-meeting-app.vercel.app'; // Ganti dengan URL Live Vercel Anda

const config: CapacitorConfig = {
  appId: APP_ID,
  appName: APP_NAME,
  webDir: 'out', // Fallback static folder untuk Next.js export
  
  // Konfigurasi server Vercel Live untuk Hot-Reload & Real-time Sync
  server: {
    url: VERCEL_LIVE_URL,
    cleartext: true, // Izinkan HTTP jika pada environment testing internal
    androidScheme: 'https'
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#020617', // Match dengan theme dark slate-950
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config',
      iconColor: '#0066FF',
      sound: 'beep.wav',
    },

    Keyboard: {
      resize: 'body',
      style: 'DARK',
      resizeOnFullScreen: true,
    }
  },

  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production',
    backgroundColor: '#020617'
  }
};

export default config;
