# Notification Store

> 自动生成 | 对应源文件: stores/notification.ts

## 概述

Notification Store 负责管理推送订阅设置。通知列表功能已降级，现在仅管理：
1. 推送订阅状态（开启/关闭）
2. 提醒时间设置
3. Service Worker 推送集成

设置持久化到 localStorage，支持离线访问。

## State

```typescript
// 推送是否启用
const pushEnabled = ref(false)

// 提醒时间
const reminderTime = ref('08:00')

// 加载状态
const loading = ref(false)
```

## Getters

```typescript
// 未读数量（兼容导航栏 badge，始终返回 0）
const unreadCount = computed(() => 0)
```

## Actions

### 设置管理

```typescript
// 初始化推送设置（从 localStorage 恢复）
function initSettings(): void

// 保存推送设置到 localStorage
function persistSettings(): void
```

### 推送操作

```typescript
// 切换推送订阅
async function togglePush(): Promise<void>

// 更新提醒时间
async function setReminderTime(time: string): Promise<void>
```

## 使用示例

### 1. 初始化设置

```typescript
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

// 在应用启动时初始化
onMounted(() => {
  notificationStore.initSettings()
})
```

### 2. 切换推送开关

```typescript
// 用户点击推送开关
async function handleTogglePush() {
  try {
    await notificationStore.togglePush()
    if (notificationStore.pushEnabled) {
      toast.success('推送已开启')
    } else {
      toast.success('推送已关闭')
    }
  } catch (error) {
    toast.error('操作失败，请重试')
  }
}
```

### 3. 设置提醒时间

```typescript
// 用户选择提醒时间
async function handleSetReminderTime(time: string) {
  try {
    await notificationStore.setReminderTime(time)
    toast.success('提醒时间已更新')
  } catch (error) {
    toast.error('更新时间失败')
  }
}
```

### 4. 组件模板使用

```typescript
// 推送开关组件
<template>
  <div>
    <label>
      <input
        type="checkbox"
        :checked="notificationStore.pushEnabled"
        @change="handleTogglePush"
        :disabled="notificationStore.loading"
      />
      开启推送通知
    </label>

    <select
      v-model="reminderTime"
      @change="handleSetReminderTime(reminderTime)"
    >
      <option value="06:00">06:00</option>
      <option value="07:00">07:00</option>
      <option value="08:00">08:00</option>
      <option value="09:00">09:00</option>
    </select>
  </div>
</template>
```

---

**维护者**: 薛小川
**最后更新**: 2026-02-05