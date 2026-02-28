# Theme Store

> 自动生成 | 对应源文件: stores/theme.ts

## 概述

Theme Store 负责管理应用的视觉主题，支持三种模式：浅色模式（light）、深色模式（dark）和跟随系统（system）。通过 localStorage 持久化用户偏好，并监听系统主题变化自动切换。

## State

```typescript
// 当前主题模式：light | dark | system
const mode = ref<ThemeMode>('system')

// 系统是否偏好深色主题
const systemPrefersDark = ref(false)
```

## Getters

### 解析后的实际主题

```typescript
/**
 * 解析system模式，返回实际生效的主题
 * @returns 'light' | 'dark'
 */
const resolvedTheme = computed<'light' | 'dark'>(())
```

### 是否为深色模式

```typescript
/**
 * 当前是否为深色模式
 * @returns boolean
 */
const isDark = computed(() => boolean)
```

### 模式显示名称

```typescript
/**
 * 获取当前模式的中文显示名称
 * @returns string
 */
const modeLabel = computed(() => string)
```

## Actions

### 初始化主题

```typescript
/**
 * 初始化主题系统
 * - 检测系统主题偏好
 * - 监听系统主题变化
 * - 加载localStorage保存的设置
 * - 应用主题到DOM
 */
const init = () => void
```

### 检测系统主题

```typescript
/**
 * 检测系统主题偏好
 * 通过 matchMedia 查询 prefers-color-scheme
 */
const detectSystemTheme = () => void
```

### 设置主题模式

```typescript
/**
 * 设置主题模式
 * @param newMode - 主题模式 (light/dark/system)
 * - 保存到localStorage
 * - 立即应用到DOM
 */
const setMode = (newMode: ThemeMode) => void
```

### 切换主题

```typescript
/**
 * 在浅色和深色之间切换
 * 不影响system模式设置
 */
const toggle = () => void
```

### 应用主题

```typescript
/**
 * 将主题应用到DOM
 * 通过操作 document.documentElement 的 classList
 * 添加/移除 'dark' 类
 */
const applyTheme = () => void
```

## 使用示例

### 1. 初始化主题（在应用入口）

```typescript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 在 App.vue 或 main.ts 中调用
onMounted(() => {
  themeStore.init()
})
```

### 2. 切换主题模式

```typescript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 切换到深色模式
const setDarkMode = () => {
  themeStore.setMode('dark')
}

// 切换到浅色模式
const setLightMode = () => {
  themeStore.setMode('light')
}

// 跟随系统
const setSystemMode = () => {
  themeStore.setMode('system')
}

// 快速切换（只在light/dark之间切换）
const toggleTheme = () => {
  themeStore.toggle()
}
```

### 3. 在组件中使用主题状态

```typescript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 响应式获取当前是否为深色模式
const isDarkTheme = computed(() => themeStore.isDark)

// 获取显示名称
const currentModeLabel = computed(() => themeStore.modeLabel)

// 根据主题切换样式类
const cardClass = computed(() => {
  return themeStore.isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'
})
```

### 4. 监听主题变化

```typescript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 主题变化时会自动应用到DOM
// 如需在JS中监听变化，可以使用 watch
watch(() => themeStore.resolvedTheme, (newTheme) => {
  console.log('主题已切换为:', newTheme)
  // 可以在这里执行其他相关操作
})
```

---

**维护者**: 薛小川
**最后更新**: 2026-02-28