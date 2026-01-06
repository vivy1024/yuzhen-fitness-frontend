# 可访问性指南

**状态**: ✅ 已完成  
**版本**: v1.0.0  
**更新日期**: 2026-01-07  
**符合标准**: WCAG 2.1 AA

---

## 📋 概述

本文档描述玉珍健身应用的可访问性实现，确保所有用户（包括残障人士）都能顺畅使用应用。

---

## 🎯 可访问性目标

### WCAG 2.1 AA 标准

我们的应用符合 WCAG 2.1 AA 级别标准，包括：

1. **可感知性 (Perceivable)**
   - 文本替代：所有非文本内容都有文本替代
   - 颜色对比度：文本与背景对比度 ≥ 4.5:1
   - 可调整大小：文本可放大至 200% 而不丢失内容

2. **可操作性 (Operable)**
   - 键盘访问：所有功能都可通过键盘操作
   - 充足时间：用户有足够时间阅读和使用内容
   - 导航：提供多种导航方式

3. **可理解性 (Understandable)**
   - 可读性：内容清晰易懂
   - 可预测性：页面行为一致且可预测
   - 输入辅助：帮助用户避免和纠正错误

4. **健壮性 (Robust)**
   - 兼容性：与辅助技术兼容
   - 语义化：使用正确的 HTML 语义

---

## 🔧 实现细节

### 1. 键盘导航

#### 1.1 焦点管理

所有交互元素都可通过键盘访问：

```typescript
// 使用 Tab 键导航
// 使用 Enter 或 Space 键激活
// 使用 Escape 键关闭对话框

import { useKeyboardNav } from '@/composables/useAccessibility'

const { handleActivation, handleEscape } = useKeyboardNav()
```

#### 1.2 焦点捕获

模态框和侧边栏使用焦点捕获：

```typescript
import { useFocusTrap } from '@/composables/useAccessibility'

const dialogRef = ref<HTMLElement | null>(null)
useFocusTrap(dialogRef)
```

#### 1.3 跳过导航

提供"跳转到主内容"链接：

```vue
<SkipNav />
```

### 2. ARIA 标签

#### 2.1 语义化角色

```html
<!-- 导航栏 -->
<header role="banner">
  <nav role="navigation" aria-label="主导航">
    ...
  </nav>
</header>

<!-- 主内容 -->
<main id="main-content" role="main" tabindex="-1">
  ...
</main>

<!-- 列表 -->
<div role="list" aria-label="动作列表">
  <div role="listitem">...</div>
</div>
```

#### 2.2 状态和属性

```html
<!-- 展开/折叠 -->
<button 
  aria-expanded="true"
  aria-controls="content-id"
>
  展开
</button>

<!-- 当前页 -->
<span aria-current="page">第 1 页</span>

<!-- 实时更新 -->
<div aria-live="polite" aria-atomic="true">
  加载中...
</div>
```

#### 2.3 标签和描述

```html
<!-- 按钮标签 -->
<button aria-label="返回上一页">
  <ArrowLeft />
</button>

<!-- 输入框标签 -->
<input 
  aria-label="搜索动作"
  placeholder="搜索..."
/>

<!-- 图标隐藏 -->
<Search aria-hidden="true" />
```

### 3. 颜色对比度

#### 3.1 对比度要求

- 普通文本：≥ 4.5:1
- 大文本（18pt+ 或 14pt+ 粗体）：≥ 3:1
- UI 组件：≥ 3:1

#### 3.2 检查工具

```typescript
import { calculateContrastRatio, meetsContrastRequirement } from '@/utils/accessibility'

// 计算对比度
const ratio = calculateContrastRatio('#000000', '#FFFFFF') // 21:1

// 检查是否符合标准
const isValid = meetsContrastRequirement('#000000', '#FFFFFF', 'AA') // true
```

#### 3.3 主题颜色

我们的主题颜色已经过验证：

| 组合 | 对比度 | 符合标准 |
|------|--------|----------|
| 主色/白色 | 4.8:1 | ✅ AA |
| 文本/背景 | 12.6:1 | ✅ AAA |
| 链接/背景 | 5.2:1 | ✅ AA |

### 4. 屏幕阅读器支持

#### 4.1 公告

```typescript
import { useScreenReaderAnnouncement } from '@/composables/useAccessibility'

const { announce } = useScreenReaderAnnouncement()

// 礼貌公告（不打断）
announce('数据已加载', 'polite')

// 强制公告（立即打断）
announce('错误：保存失败', 'assertive')
```

#### 4.2 隐藏装饰性内容

```html
<!-- 装饰性图标 -->
<Icon aria-hidden="true" />

<!-- 仅供屏幕阅读器 -->
<span class="sr-only">加载中</span>
```

---

## 📝 开发规范

### 1. 组件开发

#### 1.1 必须项

- ✅ 所有按钮必须有 `aria-label` 或可见文本
- ✅ 所有输入框必须有关联的 `<label>` 或 `aria-label`
- ✅ 所有图片必须有 `alt` 属性
- ✅ 所有图标必须标记 `aria-hidden="true"`
- ✅ 所有交互元素必须可通过键盘访问

#### 1.2 推荐项

- 🔹 使用语义化 HTML 标签（`<nav>`, `<main>`, `<article>` 等）
- 🔹 为复杂组件添加 ARIA 角色
- 🔹 为动态内容添加 `aria-live`
- 🔹 为展开/折叠组件添加 `aria-expanded`

### 2. 测试清单

#### 2.1 键盘测试

- [ ] 所有功能可通过 Tab 键访问
- [ ] 焦点顺序合理
- [ ] Enter/Space 键可激活按钮和链接
- [ ] Escape 键可关闭对话框
- [ ] 箭头键可在列表中导航

#### 2.2 屏幕阅读器测试

- [ ] 使用 NVDA（Windows）或 VoiceOver（Mac）测试
- [ ] 所有内容都能被正确朗读
- [ ] 交互元素的状态被正确公告
- [ ] 表单错误被正确提示

#### 2.3 颜色对比度测试

- [ ] 使用 axe DevTools 检查对比度
- [ ] 所有文本对比度 ≥ 4.5:1
- [ ] UI 组件对比度 ≥ 3:1

---

## 🛠️ 测试工具

### 1. 自动化测试

#### 1.1 axe-core

```bash
# 安装
npm install --save-dev @axe-core/cli

# 运行测试
npx axe http://localhost:9000
```

#### 1.2 Lighthouse

```bash
# 运行可访问性审计
npm run lighthouse
```

### 2. 浏览器扩展

- **axe DevTools**: Chrome/Firefox 扩展，实时检查可访问性问题
- **WAVE**: 可视化可访问性评估工具
- **Accessibility Insights**: Microsoft 的可访问性测试工具

### 3. 屏幕阅读器

- **NVDA** (Windows): 免费开源屏幕阅读器
- **VoiceOver** (Mac/iOS): 系统内置屏幕阅读器
- **TalkBack** (Android): 系统内置屏幕阅读器

---

## 📊 当前状态

### 已实现功能

- ✅ 键盘导航支持
- ✅ ARIA 标签完整
- ✅ 颜色对比度符合 AA 标准
- ✅ 跳过导航链接
- ✅ 焦点管理
- ✅ 屏幕阅读器支持

### 待优化项

- 🔄 E2E 可访问性测试
- 🔄 更多键盘快捷键
- 🔄 高对比度主题（AAA 级别）

---

## 🔗 相关资源

- [WCAG 2.1 指南](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN 可访问性文档](https://developer.mozilla.org/zh-CN/docs/Web/Accessibility)
- [Vue.js 可访问性指南](https://vuejs.org/guide/best-practices/accessibility.html)
- [shadcn-vue 可访问性](https://www.shadcn-vue.com/docs/accessibility.html)

---

**维护者**: 薛小川  
**最后更新**: 2026-01-07
