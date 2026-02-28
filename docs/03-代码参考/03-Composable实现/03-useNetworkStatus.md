# useNetworkStatus

> 自动生成 | 对应源文件: composables/useNetworkStatus.ts

## 概述

网络状态检测 Composable，监听浏览器网络连接状态变化（online/offline 事件），提供响应式状态和用户友好的提示。当网络断开时显示警告提示，网络恢复时显示成功提示。

## 参数

无参数（`useNetworkStatus()` 不接受参数）

## 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `isOnline` | `Ref<boolean>` | 网络是否在线 |

## 使用示例

### 示例 1：基础网络状态检测

```vue
<script setup lang="ts">
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline } = useNetworkStatus()
</script>

<template>
  <div class="status">
    <span v-if="isOnline">在线</span>
    <span v-else class="offline">离线</span>
  </div>
</template>
```

### 示例 2：根据网络状态禁用功能

```vue
<script setup lang="ts">
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline } = useNetworkStatus()

const handleSubmit = async () => {
  if (!isOnline.value) {
    alert('网络已断开，请检查网络连接')
    return
  }
  // 提交逻辑
}
</script>

<template>
  <button
    :disabled="!isOnline"
    @click="handleSubmit"
  >
    提交
  </button>
  <p v-if="!isOnline" class="warning">
    当前网络不可用，请检查网络连接后重试
  </p>
</template>
```

### 示例 3：显示网络状态指示器

```vue
<script setup lang="ts">
import { useNetworkStatus } from '@/composables/useNetworkStatus'

const { isOnline } = useNetworkStatus()
</script>

<template>
  <header>
    <div class="network-indicator" :class="{ online: isOnline, offline: !isOnline }">
      <span class="dot"></span>
      {{ isOnline ? '已连接' : '已断开' }}
    </div>
  </header>
</template>

<style scoped>
.network-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.online .dot {
  background: green;
}
.offline .dot {
  background: red;
}
</style>
```