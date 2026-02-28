# useTheme

> 自动生成 | 对应源文件: composables/useTheme.ts

## 概述

主题组合式函数，提供完整的主题切换、持久化和系统主题检测功能。内部依赖 Pinia 的 Theme Store，支持浅色模式、深色模式和跟随系统三种主题模式。

主题状态会自动保存到 localStorage，页面刷新后保持上次选择的主题。

## 参数

无输入参数。该 Composable 内部使用 `useThemeStore` 获取主题状态和操作方法。

## 返回值

### 状态属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `mode` | `ComputedRef<ThemeMode>` | 当前主题模式 (`'light'` \| `'dark'` \| `'system'`) |
| `resolvedTheme` | `ComputedRef<'light' \| 'dark'>` | 解析后的实际主题（system 模式下跟随系统） |
| `isDark` | `ComputedRef<boolean>` | 是否处于暗色模式 |
| `modeLabel` | `ComputedRef<string>` | 主题模式的显示名称 |

### 操作方法

| 方法 | 参数 | 返回类型 | 说明 |
|------|------|----------|------|
| `setTheme` | `newMode: ThemeMode` | `void` | 设置主题模式 |
| `toggleTheme` | - | `void` | 切换主题（light <-> dark） |
| `setLight` | - | `void` | 设置为浅色模式 |
| `setDark` | - | `void` | 设置为深色模式 |
| `setSystem` | - | `void` | 设置为跟随系统 |
| `initTheme` | - | `void` | 初始化主题（在 App.vue 中调用） |

## 使用示例

### 基础使用：显示当前主题状态

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { mode, resolvedTheme, isDark, modeLabel } = useTheme()
</script>

<template>
  <div class="theme-info">
    <p>当前模式: {{ mode }}</p>
    <p>解析主题: {{ resolvedTheme }}</p>
    <p>是否暗色: {{ isDark ? '是' : '否' }}</p>
    <p>显示名称: {{ modeLabel }}</p>
  </div>
</template>
```

### 主题切换按钮

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { isDark, toggleTheme, mode } = useTheme()

function getButtonText() {
  switch (mode.value) {
    case 'light': return '浅色模式'
    case 'dark': return '深色模式'
    case 'system': return '跟随系统'
  }
}
</script>

<template>
  <button @click="toggleTheme" :class="{ dark: isDark }">
    {{ getButtonText() }} - 点击切换
  </button>
</template>
```

### 设置特定主题模式

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { setLight, setDark, setSystem } = useTheme()
</script>

<template>
  <div class="theme-selector">
    <button @click="setLight">
      <span class="icon">☀️</span> 浅色
    </button>
    <button @click="setDark">
      <span class="icon">🌙</span> 深色
    </button>
    <button @click="setSystem">
      <span class="icon">💻</span> 跟随系统
    </button>
  </div>
</template>

<style scoped>
.theme-selector {
  display: flex;
  gap: 8px;
}
button {
  padding: 8px 16px;
  border-radius: 8px;
}
</style>
```

### 应用初始化

在 `App.vue` 中初始化主题（通常在 onMounted 中调用）：

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'

const { initTheme, isDark } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <div :class="{ dark: isDark }">
    <RouterView />
  </div>
</template>
```