/**
 * 通知API接口
 */

import api from './auth'

export interface Notification {
  id: string
  user_id: number
  type: 'system' | 'training' | 'membership'
  title: string
  content: string
  action_url?: string
  read: boolean
  read_at?: string
  created_at: string
  updated_at: string
}

export interface NotificationResponse {
  code: number
  msg: string
  data: Notification[]
}

export interface SingleNotificationResponse {
  code: number
  msg: string
  data: Notification
}

export interface SuccessResponse {
  code: number
  msg: string
  data?: any
}

/**
 * 获取通知列表
 */
export const getNotifications = (): Promise<NotificationResponse> => {
  return api.get('/notifications')
}

/**
 * 标记通知为已读
 */
export const markNotificationAsRead = (notificationId: string): Promise<SuccessResponse> => {
  return api.put(`/notifications/${notificationId}/read`)
}

/**
 * 删除通知
 */
export const deleteNotification = (notificationId: string): Promise<SuccessResponse> => {
  return api.delete(`/notifications/${notificationId}`)
}

/**
 * 标记所有通知为已读
 */
export const markAllNotificationsAsRead = (): Promise<SuccessResponse> => {
  return api.put('/notifications/read-all')
}
