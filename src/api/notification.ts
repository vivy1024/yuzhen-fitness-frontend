/**
 * 通知与推送设置API
 *
 * 通知列表功能已降级为本地管理，后端通知API暂未实现。
 * 保留推送订阅相关API（已有后端支持）。
 */

import api from './auth'

export interface SuccessResponse {
  code: number
  msg: string
  data?: any
}

export interface PushSettings {
  enabled: boolean
  reminderTime: string
}

// ─── Push Subscription ───────────────────────────

/**
 * 注册推送订阅
 */
export const subscribePush = (data: {
  subscription: PushSubscriptionJSON
  reminder_time?: string
}): Promise<SuccessResponse> => {
  return api.post('/push/subscribe', data)
}

/**
 * 取消推送订阅
 */
export const unsubscribePush = (endpoint: string): Promise<SuccessResponse> => {
  return api.post('/push/unsubscribe', { endpoint })
}

/**
 * 更新提醒时间
 */
export const updateReminderTime = (reminder_time: string): Promise<SuccessResponse> => {
  return api.put('/push/reminder-time', { reminder_time })
}
