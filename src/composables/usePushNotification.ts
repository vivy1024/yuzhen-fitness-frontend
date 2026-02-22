/**
 * PWA Push Notification 推送订阅管理
 *
 * 封装 Web Push API：请求权限 → 订阅 → 上报服务器 → 取消订阅
 * VAPID 公钥通过环境变量 VITE_VAPID_PUBLIC_KEY 注入
 */

import { ref, readonly } from 'vue'
import api from '@/api/auth'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
const STORAGE_KEY = 'yuzhen_push_enabled'
const REMINDER_KEY = 'yuzhen_reminder_time'

const isSupported = ref(false)
const isSubscribed = ref(false)
const permission = ref<NotificationPermission>('default')
const reminderTime = ref(localStorage.getItem(REMINDER_KEY) || '09:00')

// 初始化检测
function init() {
  isSupported.value = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if ('Notification' in window) {
    permission.value = Notification.permission
  }
  isSubscribed.value = localStorage.getItem(STORAGE_KEY) === 'true'
}
init()

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

async function subscribe(): Promise<boolean> {
  if (!isSupported.value || !VAPID_PUBLIC_KEY) return false

  try {
    const perm = await Notification.requestPermission()
    permission.value = perm
    if (perm !== 'granted') return false

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    })

    // 上报订阅信息到后端
    await api.post('/push/subscribe', {
      subscription: subscription.toJSON(),
      reminder_time: reminderTime.value,
    })

    isSubscribed.value = true
    localStorage.setItem(STORAGE_KEY, 'true')
    return true
  } catch {
    return false
  }
}

async function unsubscribe(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
      // 通知后端移除订阅
      await api.post('/push/unsubscribe', {
        endpoint: subscription.endpoint,
      })
    }
    isSubscribed.value = false
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

function setReminderTime(time: string) {
  reminderTime.value = time
  localStorage.setItem(REMINDER_KEY, time)
  // 如果已订阅，同步更新后端
  if (isSubscribed.value) {
    api.put('/push/reminder-time', { reminder_time: time }).catch(() => {})
  }
}

export function usePushNotification() {
  return {
    isSupported: readonly(isSupported),
    isSubscribed: readonly(isSubscribed),
    permission: readonly(permission),
    reminderTime,
    subscribe,
    unsubscribe,
    setReminderTime,
  }
}
