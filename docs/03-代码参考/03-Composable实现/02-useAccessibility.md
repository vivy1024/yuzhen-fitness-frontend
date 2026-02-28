# useAccessibility

> 自动生成 | 对应源文件: composables/useAccessibility.ts

## 概述

可访问性 Composable，提供键盘导航、焦点管理、ARIA 标签等功能，帮助应用实现 WCAG 无障碍访问标准。包含 5 个子 Hook：键盘导航、焦点捕获、屏幕阅读器公告、列表键盘导航、跳过导航链接。

## 参数

根据不同的子 Hook 而定，详见下文。

## 子 Hook

### useKeyboardNav

处理键盘激活和 Escape 键回调。

**参数**: 无

**返回值**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `handleActivation` | `(callback: () => void) => (event: KeyboardEvent) => void` | 处理 Enter/Space 键激活 |
| `handleEscape` | `(callback: () => void) => (event: KeyboardEvent) => void` | 处理 Escape 键 |

---

### useFocusTrap

焦点捕获 Hook，用于模态框、侧边栏等需要捕获焦点的组件。

**参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `elementRef` | `Ref<HTMLElement \| null>` | 需要捕获焦点的元素引用 |

**返回值**: 无直接返回值，在组件挂载时自动设置焦点捕获，卸载时自动恢复。

**示例**:
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFocusTrap } from '@/composables/useAccessibility'

const modalRef = ref<HTMLElement | null>(null)
useFocusTrap(modalRef)
</script>

<template>
  <div ref="modalRef" role="dialog" aria-modal="true">
    <!-- 模态框内容 -->
  </div>
</template>
```

---

### useScreenReaderAnnouncement

屏幕阅读器公告 Hook，用于向屏幕阅读器发送通知。

**参数**: 无

**返回值**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `announce` | `(message: string, priority?: 'polite' \| 'assertive') => void` | 发送公告消息 |

**优先级说明**:
- `polite`（默认）：在当前空闲时 announce
- `assertive`：立即打断当前内容 announce

---

### useListKeyboardNav

列表键盘导航 Hook，用于动作库、食物库等列表组件的上下箭头导航。

**参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| `items` | `Ref<any[]>` | 列表项数组 |
| `onSelect` | `(index: number) => void` | 选中项时的回调 |

**返回值**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `currentIndex` | `Ref<number>` | 当前选中项索引 |

**支持的按键**:
- `ArrowUp`：上一项
- `ArrowDown`：下一项

---

### useSkipNav

跳过导航链接 Hook，用于快速跳转到主内容区域。

**参数**: 无

**返回值**:

| 属性 | 类型 | 说明 |
|------|------|------|
| `skipToMain` | `() => void` | 跳转到主内容区域并聚焦 |

## 使用示例

### 示例 1：模态框焦点捕获

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useFocusTrap, useKeyboardNav } from '@/composables/useAccessibility'

const modalRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const { handleEscape } = useKeyboardNav()

// 使用焦点捕获
useFocusTrap(modalRef)

const closeModal = () => {
  isOpen.value = false
}
</script>

<template>
  <div
    v-if="isOpen"
    ref="modalRef"
    @keydown="handleEscape(closeModal)"
    role="dialog"
    aria-modal="true"
  >
    <h2>确认操作</h2>
    <button @click="closeModal">关闭</button>
  </div>
</template>
```

### 示例 2：屏幕阅读器公告

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useScreenReaderAnnouncement } from '@/composables/useAccessibility'

const { announce } = useScreenReaderAnnouncement()
const isLoading = ref(false)

const handleAction = async () => {
  isLoading.value = true
  announce('正在加载数据，请稍候', 'polite')

  await loadData()

  isLoading.value = false
  announce('数据加载完成', 'polite')
}
</script>
```

### 示例 3：列表键盘导航

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useListKeyboardNav } from '@/composables/useAccessibility'

interface Item {
  id: number
  name: string
}

const items = ref<Item[]>([
  { id: 1, name: '卧推' },
  { id: 2, name: '深蹲' },
  { id: 3, name: '硬拉' }
])

const selectedItem = ref<Item | null>(null)

const { currentIndex } = useListKeyboardNav(
  items as any,
  (index) => {
    selectedItem.value = items.value[index]
  }
)
</script>

<template>
  <ul>
    <li
      v-for="(item, index) in items"
      :key="item.id"
      :class="{ active: currentIndex === index }"
    >
      {{ item.name }}
    </li>
  </ul>
</template>
```

### 示例 4：跳过导航链接

```vue
<script setup lang="ts">
import { useSkipNav } from '@/composables/useAccessibility'

const { skipToMain } = useSkipNav()
</script>

<template>
  <!-- 页面顶部 -->
  <header>
    <a href="#main" @click.prevent="skipToMain" class="skip-link">
      跳转到主内容
    </a>
    <nav>...</nav>
  </header>

  <!-- 主内容区域 -->
  <main id="main" tabindex="-1">
    <!-- 内容 -->
  </main>
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
</style>
```