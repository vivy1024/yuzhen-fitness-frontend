# PWA图标资源

本目录存放PWA应用图标，需要准备以下尺寸的图标：

## 必需图标

### 应用图标（App Icons）
- `icon-72x72.png` - 72x72px
- `icon-96x96.png` - 96x96px
- `icon-128x128.png` - 128x128px
- `icon-144x144.png` - 144x144px
- `icon-152x152.png` - 152x152px
- `icon-192x192.png` - 192x192px（最小推荐尺寸）
- `icon-384x384.png` - 384x384px
- `icon-512x512.png` - 512x512px（最大推荐尺寸）

### 快捷方式图标（Shortcut Icons）
- `shortcut-chat.png` - 96x96px（AI对话）
- `shortcut-training.png` - 96x96px（训练计划）
- `shortcut-exercise.png` - 96x96px（动作库）
- `shortcut-progress.png` - 96x96px（进度追踪）

## 设计要求

### 图标设计规范
1. **主图标**：
   - 使用品牌主色调（#0ea5e9 - 天蓝色）
   - 简洁明了，易于识别
   - 支持maskable（安全区域内设计）
   - 背景色：白色或品牌色

2. **快捷方式图标**：
   - 与主图标风格一致
   - 使用简单的图形符号
   - 确保在小尺寸下清晰可辨

### Maskable图标
- 安全区域：中心80%区域
- 外围20%可能被裁剪
- 建议使用纯色背景

## 生成工具

### 在线工具
1. **PWA Asset Generator**
   - https://www.pwabuilder.com/imageGenerator
   - 上传1024x1024的源图标
   - 自动生成所有尺寸

2. **Favicon Generator**
   - https://realfavicongenerator.net/
   - 支持PWA图标生成

### 命令行工具
```bash
# 使用ImageMagick批量生成
convert source-icon.png -resize 72x72 icon-72x72.png
convert source-icon.png -resize 96x96 icon-96x96.png
convert source-icon.png -resize 128x128 icon-128x128.png
convert source-icon.png -resize 144x144 icon-144x144.png
convert source-icon.png -resize 152x152 icon-152x152.png
convert source-icon.png -resize 192x192 icon-192x192.png
convert source-icon.png -resize 384x384 icon-384x384.png
convert source-icon.png -resize 512x512 icon-512x512.png
```

## 临时占位符

在正式图标设计完成前，可以使用以下方式生成临时图标：

```bash
# 使用Python PIL生成纯色占位符
python scripts/generate_placeholder_icons.py
```

## 验证清单

部署前请确认：
- [ ] 所有必需尺寸的图标已生成
- [ ] 图标文件大小合理（每个<50KB）
- [ ] 图标在不同背景下清晰可见
- [ ] Maskable图标安全区域内容完整
- [ ] 快捷方式图标与功能匹配

## 参考资源

- [PWA图标指南](https://web.dev/add-manifest/)
- [Maskable图标规范](https://web.dev/maskable-icon/)
- [Material Design图标](https://material.io/design/iconography)
