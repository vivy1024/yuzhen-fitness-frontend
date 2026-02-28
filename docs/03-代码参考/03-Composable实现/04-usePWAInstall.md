# usePWAInstall

> 自动生成 | 对应源文件: composables/usePWAInstall.ts

## 概述

PWA 安装提示 Composable，监听浏览器的 `beforeinstallprompt` 事件，提供可安装 PWA 应用的提示功能。支持检测是否已安装、用户是否拒绝安装（7 天后重新提示）、触发安装流程、忽略提示等功能。

## 参数

无参数（`usePWAInstall()` 不接受参数）

## 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `canInstall` | `Ref<boolean>` | 是否可以显示安装提示 |
| `isInstalled` | `Ref<boolean>` | 是否已安装 PWA |
| `install` | `() => Promise<boolean>` | 触发 PWA 安装 |
| `dismiss` | `() => void` | 忽略安装提示 |

## 使用示例

### 示例 1：显示安装按钮

```vue
<script setup lang="ts">
import { usePWAInstall } from '@/composables/usePWAInstall'

const { canInstall, isInstalled, install, dismiss } = usePWAInstall()

const handleInstall = async () => {
  const success = await install()
  if (success) {
    console.log('PWA 安装成功')
  }
}
</script>

<template>
  <div v-if="canInstall && !isInstalled" class="install-prompt">
    <p>是否将玉珍健身安装到桌面？</p>
    <button @click="handleInstall">安装</button>
    <button @click="dismiss">暂时不要</button>
  </div>
</template>
```

### 示例 2：自动检测安装状态

```vue
<script setup lang="ts">
import { usePWAInstall } from '@/composables/usePWAInstall'

const { isInstalled, canInstall } = usePWAInstall()
</script>

<template>
  <div class="pwa-status">
    <p v-if="isInstalled">已安装 PWA</p>
    <p v-else-if="canInstall">可以安装 PWA</p>
    <p v-else>浏览器不支持 PWA 安装</p>
  </div>
</template>
```

### 示例 3：完整安装流程

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { usePWAInstall } from '@/composables/usePWAInstall'

const { canInstall, isInstalled, install, dismiss } = usePWAInstall()
const isInstalling = ref(false)

const handleInstall = async () => {
  isInstalling.value = true
  try {
    const success = await install()
    if (success) {
      // 安装成功，用户已选择添加到主屏幕
      console.log('安装成功')
    } else {
      // 用户拒绝了安装
      console.log('用户取消了安装')
    }
  } catch (error) {
    console.error('安装失败:', error)
  } finally {
    isInstalling.value = false
  }
}
</script>

<template>
  <div class="pwa-container">
    <div v-if="canInstall && !isInstalled" class="install-banner">
      <div class="content">
        <h3>安装玉珍健身 App</h3>
        <p>添加到主屏幕，更便捷地访问</p>
      </div>
      <div class="actions">
        <button
          @click="handleInstall"
          :disabled="isInstalling"
        >
          {{ isInstalling ? '安装中...' : '立即安装' }}
        </button>
        <button @click="dismiss" class="dismiss">
          暂不
        </button>
      </div>
    </div>

    <div v-if="isInstalled" class="installed-badge">
      已安装到主屏幕
    </div>
  </div>
</template>

<style scoped>
.install-banner {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 8px;
}

.dismiss {
  background: transparent;
  color: #666;
}
</style>
```