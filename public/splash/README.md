# PWA启动画面资源

本目录存放PWA应用启动画面（Splash Screen）资源。

## iOS启动画面尺寸

### iPhone
- `splash-iphone-5-640x1136.png` - iPhone 5/SE (640x1136)
- `splash-iphone-6-750x1334.png` - iPhone 6/7/8 (750x1334)
- `splash-iphone-6-plus-1242x2208.png` - iPhone 6/7/8 Plus (1242x2208)
- `splash-iphone-x-1125x2436.png` - iPhone X/XS/11 Pro (1125x2436)
- `splash-iphone-xr-828x1792.png` - iPhone XR/11 (828x1792)
- `splash-iphone-xs-max-1242x2688.png` - iPhone XS Max/11 Pro Max (1242x2688)
- `splash-iphone-12-1170x2532.png` - iPhone 12/13/14 (1170x2532)
- `splash-iphone-12-pro-max-1284x2778.png` - iPhone 12/13/14 Pro Max (1284x2778)

### iPad
- `splash-ipad-1536x2048.png` - iPad (1536x2048)
- `splash-ipad-pro-10-1668x2224.png` - iPad Pro 10.5" (1668x2224)
- `splash-ipad-pro-11-1668x2388.png` - iPad Pro 11" (1668x2388)
- `splash-ipad-pro-12-2048x2732.png` - iPad Pro 12.9" (2048x2732)

## Android启动画面

Android使用自适应图标和主题色，通过manifest.json配置：
- `background_color`: 启动画面背景色
- `theme_color`: 主题色

## 设计要求

### 启动画面设计规范
1. **布局**：
   - 居中显示应用Logo
   - 简洁的背景（纯色或渐变）
   - 可选：应用名称或Slogan

2. **颜色**：
   - 背景色：白色（#ffffff）或品牌色
   - Logo颜色：与品牌一致
   - 确保对比度足够

3. **尺寸**：
   - Logo占屏幕宽度的30-40%
   - 上下留白充足
   - 适配不同屏幕比例

## 生成方法

### 方法1：使用PWA Asset Generator
```bash
# 访问 https://www.pwabuilder.com/imageGenerator
# 上传1024x1024的Logo
# 选择"Generate splash screens"
# 下载生成的所有尺寸
```

### 方法2：使用pwa-asset-generator
```bash
npm install -g pwa-asset-generator

# 生成所有启动画面
pwa-asset-generator logo.png ./public/splash \
  --splash-only \
  --background "#ffffff" \
  --padding "20%"
```

### 方法3：手动设计
使用Figma/Sketch/Photoshop设计，导出各尺寸PNG文件。

## HTML配置

在`index.html`中添加启动画面链接：

```html
<!-- iOS启动画面 -->
<link rel="apple-touch-startup-image" href="/splash/splash-iphone-5-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/splash/splash-iphone-6-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/splash/splash-iphone-6-plus-1242x2208.png" media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/splash/splash-iphone-x-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/splash/splash-iphone-xr-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/splash/splash-iphone-xs-max-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/splash/splash-iphone-12-1170x2532.png" media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)">
<link rel="apple-touch-startup-image" href="/splash/splash-iphone-12-pro-max-1284x2778.png" media="(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)">

<!-- iPad启动画面 -->
<link rel="apple-touch-startup-image" href="/splash/splash-ipad-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/splash/splash-ipad-pro-10-1668x2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/splash/splash-ipad-pro-11-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)">
<link rel="apple-touch-startup-image" href="/splash/splash-ipad-pro-12-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)">
```

## 验证清单

部署前请确认：
- [ ] 所有必需尺寸的启动画面已生成
- [ ] 启动画面在不同设备上显示正常
- [ ] 背景色与manifest.json中的background_color一致
- [ ] Logo清晰可见，不模糊
- [ ] 文件大小合理（每个<200KB）

## 参考资源

- [iOS启动画面指南](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/launch-screen/)
- [PWA启动画面最佳实践](https://web.dev/splash-screen/)
- [Adaptive Icon规范](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
