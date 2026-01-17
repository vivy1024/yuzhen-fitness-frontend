# 玉珍健身移动App打包指南

**版本**: v1.0.0  
**更新日期**: 2026-01-07  
**状态**: 📋 待实施  
**维护者**: 薛小川

---

## 📋 概述

本文档提供玉珍健身PWA应用打包成原生移动App的完整指南，包括Android和iOS平台。

### 当前状态

- ✅ **PWA应用**：已完成，可通过浏览器访问
- ⏳ **Android App**：待打包
- ⏳ **iOS App**：待打包（需要macOS环境）

### 用户访问方式

#### 方式1：PWA应用（推荐，无需下载）

**优势**：
- ✅ 无需下载安装
- ✅ 自动更新
- ✅ 跨平台兼容
- ✅ 节省存储空间

**使用步骤**：
1. 打开手机浏览器（Chrome、Safari等）
2. 访问：`https://yuzhen-fitness.cn`
3. 点击浏览器菜单 → "添加到主屏幕"
4. 完成！现在可以像原生App一样使用

#### 方式2：原生App（需要打包上架）

**优势**：
- ✅ 应用商店可见性
- ✅ 更好的系统集成
- ✅ 用户信任度高

**劣势**：
- ❌ 需要审核（1-7天）
- ❌ 需要维护多个版本
- ❌ 更新需要用户手动升级

---

## 🚀 第一部分：Capacitor集成

### 1.1 安装Capacitor

```bash
cd yuzhen_fitness

# 安装Capacitor核心包
npm install @capacitor/core @capacitor/cli

# 安装平台包
npm install @capacitor/android @capacitor/ios

# 安装常用插件
npm install @capacitor/app          # 应用生命周期
npm install @capacitor/status-bar   # 状态栏
npm install @capacitor/splash-screen # 启动屏
npm install @capacitor/keyboard     # 键盘
npm install @capacitor/network      # 网络状态
npm install @capacitor/storage      # 本地存储
npm install @capacitor/camera       # 相机（用户头像）
npm install @capacitor/filesystem   # 文件系统
npm install @capacitor/share        # 分享功能
```

### 1.2 初始化Capacitor

```bash
# 初始化Capacitor配置
npx cap init "玉珍健身" "com.yuzhen.fitness"
```

### 1.3 配置Capacitor

创建 `capacitor.config.ts`：

```typescript
import { CapacitorConfig } from '@capacitor/cli';

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
      iosSpinnerStyle: "small",
      spinnerColor: "#10b981"
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#10b981'
    }
  }
};

export default config;
```

### 1.4 更新package.json

```json
{
  "scripts": {
    "cap:sync": "cap sync",
    "cap:android": "cap open android",
    "cap:ios": "cap open ios",
    "build:android": "npm run build && cap sync android",
    "build:ios": "npm run build && cap sync ios"
  }
}
```

---

## 📱 第二部分：Android打包

### 2.1 添加Android平台

```bash
# 构建前端
npm run build

# 添加Android平台
npx cap add android

# 同步代码到Android项目
npx cap sync android
```

### 2.2 配置Android项目

#### 修改 `android/app/build.gradle`

```gradle
android {
    namespace "com.yuzhen.fitness"
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.yuzhen.fitness"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
    
    signingConfigs {
        release {
            storeFile file('yuzhen-fitness-release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias 'yuzhen-fitness'
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
}
```

### 2.3 生成签名密钥

```bash
# 生成密钥库（只需执行一次）
keytool -genkey -v -keystore yuzhen-fitness-release.keystore \
  -alias yuzhen-fitness \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 输入信息：
# - 密钥库密码：[设置强密码]
# - 姓名：薛小川
# - 组织单位：玉珍健身
# - 组织：玉珍健身
# - 城市：北京
# - 省份：北京
# - 国家代码：CN

# 将密钥库移动到Android项目
mv yuzhen-fitness-release.keystore yuzhen_fitness/android/app/

# ⚠️ 重要：备份密钥库到安全位置
cp yuzhen_fitness/android/app/yuzhen-fitness-release.keystore ~/backups/
```

### 2.4 配置环境变量

创建 `android/local.properties`：

```properties
sdk.dir=/Users/你的用户名/Library/Android/sdk
KEYSTORE_PASSWORD=你的密钥库密码
KEY_PASSWORD=你的密钥密码
```

⚠️ **重要**：不要将 `local.properties` 提交到Git！

### 2.5 构建APK

```bash
cd android

# 构建Debug版本（用于测试）
./gradlew assembleDebug

# 构建Release版本（用于发布）
./gradlew assembleRelease

# APK位置：
# Debug: android/app/build/outputs/apk/debug/app-debug.apk
# Release: android/app/build/outputs/apk/release/app-release.apk
```

### 2.6 构建AAB（Google Play）

```bash
cd android

# 构建AAB（Android App Bundle）
./gradlew bundleRelease

# AAB位置：
# android/app/build/outputs/bundle/release/app-release.aab
```

### 2.7 测试APK

```bash
# 安装到连接的Android设备
adb install android/app/build/outputs/apk/release/app-release.apk

# 或者直接运行
./gradlew installRelease
```

---

## 🍎 第三部分：iOS打包（需要macOS）

### 3.1 添加iOS平台

```bash
# 构建前端
npm run build

# 添加iOS平台
npx cap add ios

# 同步代码到iOS项目
npx cap sync ios
```

### 3.2 配置iOS项目

#### 打开Xcode

```bash
npx cap open ios
```

#### 配置项目设置

1. **General标签**：
   - Display Name: 玉珍健身
   - Bundle Identifier: com.yuzhen.fitness
   - Version: 1.0.0
   - Build: 1
   - Deployment Target: iOS 13.0

2. **Signing & Capabilities**：
   - Team: 选择你的Apple Developer账号
   - Signing Certificate: 自动管理签名

3. **Info.plist配置**：
```xml
<key>NSCameraUsageDescription</key>
<string>需要访问相机以上传头像</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要访问相册以选择头像</string>
```

### 3.3 构建IPA

1. 在Xcode中选择 `Product` → `Archive`
2. 等待构建完成
3. 在Organizer中选择刚构建的Archive
4. 点击 `Distribute App`
5. 选择发布方式：
   - App Store Connect（上架App Store）
   - Ad Hoc（内部测试）
   - Development（开发测试）

---

## 🏪 第四部分：应用商店发布

### 4.1 Google Play发布

#### 准备工作

1. **注册Google Play开发者账号**
   - 费用：$25（一次性）
   - 网址：https://play.google.com/console

2. **准备应用资源**
   - 应用图标：512x512px（PNG）
   - 功能图片：1024x500px
   - 应用截图：至少2张（手机和平板）
   - 应用描述：简短描述（80字）+ 完整描述（4000字）

#### 发布步骤

1. **创建应用**
   - 登录Google Play Console
   - 点击"创建应用"
   - 填写应用名称：玉珍健身
   - 选择默认语言：中文（简体）
   - 应用类型：应用
   - 免费/付费：免费

2. **填写应用信息**
   - 应用详情：名称、简短描述、完整描述
   - 图形资源：图标、功能图片、截图
   - 分类：健康与健身
   - 联系方式：邮箱、网站

3. **内容分级**
   - 填写内容分级问卷
   - 玉珍健身应该是"所有人"级别

4. **上传APK/AAB**
   - 进入"发布" → "生产"
   - 点击"创建新版本"
   - 上传AAB文件
   - 填写版本说明

5. **提交审核**
   - 检查所有必填项
   - 点击"提交审核"
   - 等待审核（通常1-3天）

### 4.2 App Store发布

#### 准备工作

1. **注册Apple Developer账号**
   - 费用：$99/年
   - 网址：https://developer.apple.com

2. **准备应用资源**
   - 应用图标：1024x1024px（PNG，无透明度）
   - 应用截图：
     - iPhone 6.7": 1290x2796px（至少3张）
     - iPhone 6.5": 1242x2688px
     - iPad Pro 12.9": 2048x2732px
   - 应用预览视频（可选）

#### 发布步骤

1. **创建App ID**
   - 登录Apple Developer
   - Certificates, Identifiers & Profiles
   - Identifiers → App IDs
   - Bundle ID: com.yuzhen.fitness

2. **App Store Connect配置**
   - 登录App Store Connect
   - 我的App → 添加新App
   - 平台：iOS
   - 名称：玉珍健身
   - Bundle ID: com.yuzhen.fitness
   - SKU: yuzhen-fitness-001

3. **填写应用信息**
   - 应用信息：名称、副标题、类别
   - 定价和销售范围：免费，中国
   - 应用隐私：隐私政策URL
   - 年龄分级：4+

4. **上传构建版本**
   - 使用Xcode Archive上传
   - 或使用Transporter上传IPA

5. **提交审核**
   - 填写审核信息
   - 提供测试账号（如需要）
   - 提交审核
   - 等待审核（通常1-7天）

---

## 📊 第五部分：版本管理

### 5.1 版本号规范

```
主版本号.次版本号.修订号-构建号

示例：
1.0.0-1    # 首次发布
1.0.1-2    # Bug修复
1.1.0-3    # 功能更新
2.0.0-4    # 重大更新
```

### 5.2 更新流程

```bash
# 1. 更新版本号
npm version patch  # 或 minor/major

# 2. 更新原生项目版本号
# Android: android/app/build.gradle
# iOS: Xcode项目设置

# 3. 构建前端
npm run build

# 4. 同步到原生项目
npx cap sync

# 5. 构建APK/AAB
cd android && ./gradlew bundleRelease

# 6. 构建IPA
# 使用Xcode Archive

# 7. 上传到应用商店
# Google Play Console / App Store Connect

# 8. 提交代码
git add .
git commit -m "chore(release): v1.0.1"
git tag v1.0.1
git push origin main --tags
```

---

## ✅ 检查清单

### 打包前检查

- [ ] 前端代码已构建（`npm run build`）
- [ ] 环境变量已配置（生产环境API地址）
- [ ] 应用图标已准备（各种尺寸）
- [ ] 启动屏已配置
- [ ] 版本号已更新
- [ ] 签名密钥已配置（Android）
- [ ] 证书已配置（iOS）

### 发布前检查

- [ ] 应用在真机上测试通过
- [ ] 所有功能正常工作
- [ ] 性能测试通过
- [ ] 隐私政策已准备
- [ ] 用户协议已准备
- [ ] 应用截图已准备
- [ ] 应用描述已撰写
- [ ] 联系方式已填写

### 发布后检查

- [ ] 应用商店页面正常显示
- [ ] 用户可以正常下载安装
- [ ] 应用可以正常启动
- [ ] 所有功能正常工作
- [ ] 监控应用崩溃率
- [ ] 收集用户反馈

---

## 🔗 相关文档

- [生产环境部署规划](../../docs/06-部署运维/04-生产环境部署与运营规划.md)
- [Zeabur部署指南](./zeabur-deployment-guide.md)
- [Capacitor官方文档](https://capacitorjs.com/docs)

---

## 📚 参考资源

- [Capacitor官方文档](https://capacitorjs.com/docs)
- [Android开发者指南](https://developer.android.com)
- [iOS开发者指南](https://developer.apple.com)
- [Google Play Console帮助](https://support.google.com/googleplay/android-developer)
- [App Store Connect帮助](https://developer.apple.com/app-store-connect/)

---

**维护者**: 薛小川  
**最后更新**: 2026-01-07  
**文档版本**: v1.0.0

<div align="center">
<strong>📱 移动App打包 · 🏪 应用商店发布 · 📊 版本管理</strong>
</div>
