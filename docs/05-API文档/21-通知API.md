# 通知API

**状态**: 已完成
**版本**: v1.0.0
**更新日期**: 2026-02-28
**对应源文件**: `src/api/notification.ts`
**后端模块**: `app/Modules/Push/Controllers/PushController.php`

---

## 概述

通知API提供Web Push推送订阅管理功能。用户可以订阅或取消订阅推送通知，设置提醒时间。

**核心功能**：
- 注册推送订阅
- 取消推送订阅
- 更新提醒时间

**说明**：通知列表功能已降级为本地管理，后端通知API暂未实现。保留推送订阅相关API（已有后端支持）。

---

## 端点列表

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/push/subscribe | 注册推送订阅 | 是 |
| POST | /api/push/unsubscribe | 取消推送订阅 | 是 |
| PUT | /api/push/reminder-time | 更新提醒时间 | 是 |

---

## 详细说明

### 1. 注册推送订阅

注册Web Push推送订阅，接收训练提醒等通知。

```http
POST /api/push/subscribe
```

**认证**: Bearer Token

**请求参数**：
```typescript
{
  subscription: PushSubscriptionJSON;  // 浏览器Push订阅对象
  reminder_time?: string;              // 提醒时间（可选，格式：HH:mm）
}
```

**请求示例**：
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/xxx",
    "keys": {
      "p256dh": "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
      "auth": "taryItcN8Qb1gTwdY8xY-g"
    }
  },
  "reminder_time": "09:00"
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": null
}
```

---

### 2. 取消推送订阅

取消已注册的推送订阅，停止接收通知。

```http
POST /api/push/unsubscribe
```

**认证**: Bearer Token

**请求参数**：
```typescript
{
  endpoint: string;  // 推送订阅的endpoint
}
```

**请求示例**：
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/xxx"
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": null
}
```

---

### 3. 更新提醒时间

更新每日推送提醒的时间。

```http
PUT /api/push/reminder-time
```

**认证**: Bearer Token

**请求参数**：
```typescript
{
  reminder_time: string;  // 提醒时间，格式：HH:mm
}
```

**请求示例**：
```json
{
  "reminder_time": "07:30"
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": null
}
```

---

## 数据结构

### PushSettings（推送设置）

```typescript
interface PushSettings {
  enabled: boolean;         // 是否启用
  reminderTime: string;    // 提醒时间（HH:mm）
}
```

### SuccessResponse（通用响应）

```typescript
interface SuccessResponse {
  code: number;             // 状态码
  msg: string;              // 消息
  data?: any;               // 数据
}
```

---

## 浏览器Push订阅流程

```typescript
// 1. 检查浏览器是否支持Push
if ('serviceWorker' in navigator && 'PushManager' in window) {
  // 2. 请求用户授权
  const permission = await Notification.requestPermission()

  if (permission === 'granted') {
    // 3. 获取service worker注册
    const registration = await navigator.serviceWorker.ready

    // 4. 订阅Push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    // 5. 发送到后端保存
    await subscribePush({
      subscription: subscription.toJSON(),
      reminder_time: '09:00'
    })
  }
}

// 辅助函数：将VAPID公钥转换为Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未授权，请先登录 |
| 422 | 订阅验证失败 |
| 500 | 服务器内部错误 |

---

## 前端集成示例

```typescript
// composables/useNotification.ts
import { ref } from 'vue'
import { subscribePush, unsubscribePush, updateReminderTime } from '@/api/notification'

export function useNotification() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isSubscribed = ref(false)

  // 订阅推送
  const subscribe = async (subscription: PushSubscriptionJSON, reminderTime?: string) => {
    loading.value = true
    try {
      const response = await subscribePush({ subscription, reminder_time: reminderTime })
      isSubscribed.value = true
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '订阅失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 取消订阅
  const unsubscribe = async (endpoint: string) => {
    loading.value = true
    try {
      const response = await unsubscribePush(endpoint)
      isSubscribed.value = false
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '取消订阅失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新提醒时间
  const setReminderTime = async (time: string) => {
    loading.value = true
    try {
      const response = await updateReminderTime(time)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '设置提醒时间失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    isSubscribed,
    subscribe,
    unsubscribe,
    setReminderTime
  }
}
```

---

## 相关文档

- [设置API](./20-设置API.md) - 用户设置管理
- [认证系统API](./01-认证系统API.md) - 用户登录注册

---

## 版本历史

### v1.0.0 (2026-02-28)
- 初始版本
- 文档化3个推送订阅API端点
- 说明Web Push订阅流程
- 说明浏览器Push API的使用方法