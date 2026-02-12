import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yuzhen.fitness',
  appName: '玉珍健身',
  webDir: 'dist',
  server: {
    // 使用本地打包的dist文件，不加载远程网页
    androidScheme: 'https',
    // 允许API请求到后端域名
    allowNavigation: [
      'api.yuzhen-fitness.cn',
      'app.yuzhen-fitness.cn',
    ]
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
