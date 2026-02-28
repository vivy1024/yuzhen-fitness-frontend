# usePushNotification

> 自动生成 | 对应源文件: composables/usePushNotification.ts

## 概述

PWA 推送订阅管理 Composable，封装 Web Push API 实现完整的推送通知功能。该模块负责请求通知权限、订阅推送服务、上报订阅信息到服务器、以及取消订阅等操作。

VAPID 公钥通过环境变量 `VITE_VAPID_PUBLIC_KEY` 注入，用于与推送服务器建立安全连接。

## 参数

无输入参数。该 Composable 使用以下环境变量和本地存储：

- `VITE_VAPID_PUBLIC_KEY` - VAPID 公钥（环境变量）
- `yuzhen_push_enabled` - 订阅状态存储键
- `yuzhen_reminder_time` - 提醒时间存储键

## 返回值

| 属性 | 类型 | 说明 |
|------|------|------|
| `isSupported` | `Readonly<Ref<boolean>>` | 浏览器是否支持 Web Push API |
| `isSubscribed` | `Readonly<Ref<boolean>>` | 当前是否已订阅推送通知 |
| `permission` | `Readonly<Ref<NotificationPermission>>` | 通知权限状态 (`default`/`granted`/`denied`) |
| `reminderTime` | `Ref<string>` | 提醒时间（格式：HH:mm） |
| `subscribe` | `() => Promise<boolean>` | 订阅推送通知 |
| `unsubscribe` | `() => Promise<boolean>` | 取消订阅 |
| `setReminderTime` | `(time: string) => void` | 设置提醒时间 |

## 使用示例

### 基础使用：检查推送支持状态

```vue
<script setup lang="ts">
import { usePushNotification } from '@/composables/usePushNotification'

const { isSupported, permission, isSubscribed } = usePushNotification()
</script>

<template>
  <div v-if="!isSupported">
    您的浏览器不支持推送通知
  </div>
  <div v-else>
    <p>权限状态: {{ permission }}</p>
    <p>订阅状态: {{ isSubscribed ? '已订阅' : '未订阅' }}</p>
  </div>
</template>
```

### 订阅推送通知

```vue
<script setup lang="ts">
import { usePushNotification } from '@/composables/usePushNotification'

const { subscribe, isSubscribed } = usePushNotification()

async function handleSubscribe() {
  const success = await subscribe()
  if (success) {
    console.log('订阅成功')
  } else {
    console.log('订阅失败，请检查通知权限')
  }
}
</script>

<template>
  <button @click="handleSubscribe" :disabled="isSubscribed">
    {{ isSubscribed ? '已订阅' : '开启推送通知' }}
  </button>
</template>
```

### 设置提醒时间

```vue
<script setup lang="ts">
import { usePushNotification } from '@/composables/usePushNotification'

const { reminderTime, setReminderTime } = usePushNotification()

function handleTimeChange(event: Event) {
  const time = (event.target as HTMLInputElement).value
  setReminderTime(time)
}
</script>

<template>
  <label>
    训练提醒时间：
    <input type="time" :value="reminderTime" @change="handleTimeChange" />
  </label>
</template>
```