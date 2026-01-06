/**
 * 通知状态管理
 * 使用Pinia管理消息通知状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification as deleteNotificationApi,
  markAllNotificationsAsRead,
  type Notification
} from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref<Notification[]>([])
  const loading = ref(false)

  // Getters
  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  const unreadNotifications = computed(() => {
    return notifications.value.filter(n => !n.read)
  })

  const systemNotifications = computed(() => {
    return notifications.value.filter(n => n.type === 'system')
  })

  const trainingNotifications = computed(() => {
    return notifications.value.filter(n => n.type === 'training')
  })

  const membershipNotifications = computed(() => {
    return notifications.value.filter(n => n.type === 'membership')
  })

  // Actions

  /**
   * 获取通知列表
   */
  async function fetchNotifications() {
    try {
      loading.value = true
      const response = await getNotifications()
      
      if (response.code === 200 && response.data) {
        notifications.value = response.data
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 标记通知为已读
   */
  async function markAsRead(notificationId: string) {
    try {
      const response = await markNotificationAsRead(notificationId)
      
      if (response.code === 200) {
        // 更新本地状态
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification) {
          notification.read = true
          notification.read_at = new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      throw error
    }
  }

  /**
   * 标记所有通知为已读
   */
  async function markAllAsRead() {
    try {
      const response = await markAllNotificationsAsRead()
      
      if (response.code === 200) {
        // 更新本地状态
        const now = new Date().toISOString()
        notifications.value.forEach(n => {
          n.read = true
          n.read_at = now
        })
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      throw error
    }
  }

  /**
   * 删除通知
   */
  async function deleteNotification(notificationId: string) {
    try {
      const response = await deleteNotificationApi(notificationId)
      
      if (response.code === 200) {
        // 从本地状态中移除
        const index = notifications.value.findIndex(n => n.id === notificationId)
        if (index !== -1) {
          notifications.value.splice(index, 1)
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
      throw error
    }
  }

  /**
   * 添加新通知（用于实时推送）
   */
  function addNotification(notification: Notification) {
    // 检查是否已存在
    const exists = notifications.value.some(n => n.id === notification.id)
    if (!exists) {
      notifications.value.unshift(notification)
    }
  }

  /**
   * 清空所有通知
   */
  function clearNotifications() {
    notifications.value = []
  }

  return {
    // State
    notifications,
    loading,

    // Getters
    unreadCount,
    unreadNotifications,
    systemNotifications,
    trainingNotifications,
    membershipNotifications,

    // Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    clearNotifications,
  }
})
