import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yuzhen.fitness',
  appName: '玉珍健身',
  webDir: 'dist',
  server: {
    // 生产环境配置
    url: 'https://yuzhen-fitness.cn',
    cleartext: false,
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#10b981"
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#10b981'
    }
  }
};

export default config;
