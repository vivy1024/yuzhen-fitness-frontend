# 性能测试指南

## 概述

本文档说明如何对玉珍健身PWA应用进行性能测试，确保应用满足性能指标要求。

## 性能目标

### 桌面端目标
- **Performance Score**: ≥ 90
- **First Contentful Paint (FCP)**: < 2s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Blocking Time (TBT)**: < 300ms
- **Speed Index**: < 3s

### 移动端目标
- **Performance Score**: ≥ 85
- **First Contentful Paint (FCP)**: < 2.5s
- **Largest Contentful Paint (LCP)**: < 3s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Total Blocking Time (TBT)**: < 500ms
- **Speed Index**: < 4s
- **Time to Interactive (TTI)**: < 5s

## 使用Lighthouse进行性能测试

### 方法1：Chrome DevTools（推荐用于开发）

1. 构建生产版本：
```bash
npm run build
npm run preview
```

2. 打开Chrome浏览器，访问 `http://localhost:4173`

3. 打开DevTools（F12），切换到"Lighthouse"标签

4. 配置测试：
   - **Mode**: Navigation
   - **Device**: Mobile 或 Desktop
   - **Categories**: 全选（Performance, Accessibility, Best Practices, SEO, PWA）

5. 点击"Analyze page load"开始测试

6. 查看报告，重点关注：
   - Performance分数
   - Core Web Vitals指标
   - Opportunities（优化建议）
   - Diagnostics（诊断信息）

### 方法2：Lighthouse CI（推荐用于CI/CD）

1. 安装Lighthouse CI：
```bash
npm install -g @lhci/cli
```

2. 构建生产版本：
```bash
npm run build
```

3. 运行桌面端测试：
```bash
lhci autorun --config=lighthouserc.json
```

4. 运行移动端测试：
```bash
lhci autorun --config=lighthouserc.mobile.json
```

5. 查看测试报告：
   - 测试完成后会生成HTML报告
   - 报告会自动上传到临时存储，获得一个公开链接
   - 可以在终端中看到测试结果摘要

### 方法3：命令行Lighthouse

1. 安装Lighthouse：
```bash
npm install -g lighthouse
```

2. 启动预览服务器：
```bash
npm run preview
```

3. 运行测试（桌面端）：
```bash
lighthouse http://localhost:4173 --preset=desktop --output=html --output-path=./lighthouse-report-desktop.html
```

4. 运行测试（移动端）：
```bash
lighthouse http://localhost:4173 --preset=mobile --output=html --output-path=./lighthouse-report-mobile.html
```

5. 打开生成的HTML报告查看详细结果

## 性能优化已实施的措施

### 1. 代码分割和懒加载 ✅
- **路由级代码分割**：每个页面独立打包
- **组件懒加载**：大型组件按需加载
- **第三方库分割**：Vue、UI库、工具库分别打包
- **配置文件**：`vite.config.ts` 中的 `manualChunks`

### 2. 图片优化 ✅
- **LazyImage组件**：使用Intersection Observer实现图片懒加载
- **占位符**：加载前显示占位符，避免布局抖动
- **加载动画**：提供视觉反馈
- **错误处理**：图片加载失败时显示友好提示
- **应用范围**：动作库、食物库、动作详情页

### 3. 列表渲染优化 ✅
- **分页机制**：每页20个项目，避免一次性渲染大量DOM
- **响应式布局**：Grid布局自适应不同屏幕尺寸
- **按需加载**：只加载当前页数据
- **应用范围**：动作库（1603个动作）、食物库（1851个食物）

### 4. 构建优化 ✅
- **CSS代码分割**：CSS按页面分割
- **Tree Shaking**：移除未使用的代码
- **压缩**：使用esbuild进行代码压缩
- **目标浏览器**：ES2020，平衡兼容性和性能
- **Chunk大小警告**：设置500KB阈值

### 5. 依赖优化 ✅
- **预构建**：Vite自动预构建依赖
- **包含列表**：明确指定需要预构建的依赖
- **排除列表**：排除不需要预构建的依赖

## 性能测试检查清单

在进行性能测试前，确保：

- [ ] 已构建生产版本（`npm run build`）
- [ ] 使用生产模式预览（`npm run preview`）
- [ ] 关闭浏览器扩展（可能影响测试结果）
- [ ] 清除浏览器缓存
- [ ] 使用隐身模式（避免缓存干扰）
- [ ] 网络环境稳定
- [ ] 测试多个页面（首页、聊天、动作库、食物库）
- [ ] 测试桌面端和移动端

## 常见性能问题和解决方案

### 问题1：FCP/LCP过高
**原因**：
- 首屏资源过大
- 关键资源加载慢
- 字体加载阻塞渲染

**解决方案**：
- 使用代码分割减小首屏bundle大小
- 预加载关键资源（`<link rel="preload">`）
- 使用字体显示策略（`font-display: swap`）

### 问题2：CLS过高
**原因**：
- 图片没有设置尺寸
- 动态内容插入导致布局抖动
- 字体加载导致文本跳动

**解决方案**：
- 为图片设置width和height属性
- 使用LazyImage组件的占位符
- 使用骨架屏避免内容跳动

### 问题3：TBT过高
**原因**：
- JavaScript执行时间过长
- 主线程阻塞
- 大型第三方库

**解决方案**：
- 代码分割，减小单个bundle大小
- 使用Web Worker处理耗时任务
- 延迟加载非关键JavaScript

### 问题4：Bundle过大
**原因**：
- 未使用的代码未被移除
- 第三方库过大
- 重复打包

**解决方案**：
- 启用Tree Shaking
- 使用轻量级替代库
- 配置manualChunks避免重复打包

## 持续监控

### 开发阶段
- 每次重大功能开发后运行Lighthouse测试
- 关注Performance分数变化趋势
- 及时发现和修复性能退化

### CI/CD集成
- 在CI/CD流程中集成Lighthouse CI
- 设置性能预算（Performance Budget）
- 性能指标不达标时阻止部署

### 生产环境
- 使用Real User Monitoring (RUM)工具
- 收集真实用户的性能数据
- 定期分析性能报告

## 参考资料

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Vite Performance](https://vitejs.dev/guide/performance.html)

## 更新日志

- **2026-01-07**: 创建性能测试指南
- **2026-01-07**: 添加Lighthouse配置文件（桌面端和移动端）
- **2026-01-07**: 记录已实施的性能优化措施
