/**
 * 推送设置状态管理
 *
 * 通知列表功能已降级，改为管理推送订阅设置。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  subscribePush,
  unsubscribePush,
  updateReminderTime,
} from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const pushEnabled = ref(false)
  const reminderTime = ref('08:00')
  const loading = ref(false)

  // Getters — 保留 unreadCount 兼容导航栏 badge
  const unreadCount = computed(() => 0)

  // Actions

  /**
   * 初始化推送设置（从 localStorage 恢复）
   */
  function initSettings() {
    const saved = localStorage.getItem('push_settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        pushEnabled.value = parsed.enabled ?? false
        reminderTime.value = parsed.reminderTime ?? '08:00'
      } catch {
        // ignore
      }
    }
  }

  /**
   * 保存推送设置到 localStorage
   */
  function persistSettings() {
    localStorage.setItem('push_settings', JSON.stringify({
      enabled: pushEnabled.value,
      reminderTime: reminderTime.value,
    }))
  }

  /**
   * 切换推送订阅
   */
  async function togglePush() {
    loading.value = true
    try {
      if (pushEnabled.value) {
        // 取消订阅
        const reg = await navigator.serviceWorker?.ready
        const sub = await reg?.pushManager?.getSubscription()
        if (sub) {
          await unsubscribePush(sub.endpoint)
          await sub.unsubscribe()
        }
        pushEnabled.value = false
      } else {
        // 订阅
        const reg = await navigator.serviceWorker?.ready
        if (reg) {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
          })
          await subscribePush({
            subscription: sub.toJSON(),
            reminder_time: reminderTime.value,
          })
          pushEnabled.value = true
        }
      }
      persistSettings()
    } catch (error) {
      console.error('切换推送订阅失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新提醒时间
   */
  async function setReminderTime(time: string) {
    try {
      await updateReminderTime(time)
      reminderTime.value = time
      persistSettings()
    } catch (error) {
      console.error('更新提醒时间失败:', error)
      throw error
    }
  }

  return {
    // State
    pushEnabled,
    reminderTime,
    loading,

    // Getters
    unreadCount,

    // Actions
    initSettings,
    togglePush,
    setReminderTime,
  }
})
