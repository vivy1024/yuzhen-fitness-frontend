/**
 * 手机绑定 API
 */
import api from './auth'

export interface PhoneStatus {
  has_phone: boolean
  phone: string | null
  phone_verified: boolean
  phone_bound_at: string | null
}

export interface PhoneStatusResponse {
  code: number
  msg?: string
  data: PhoneStatus
}

/**
 * 获取手机号绑定状态
 */
export const getPhoneStatus = (): Promise<PhoneStatusResponse> => {
  return api.get('/user/phone/status')
}

/**
 * 绑定手机号
 */
export const bindPhone = (phone: string, code: string): Promise<{ code: number; msg?: string; data?: any }> => {
  return api.post('/user/phone/bind', { phone, code })
}

/**
 * 解绑手机号
 */
export const unbindPhone = (password: string): Promise<{ code: number; msg?: string }> => {
  return api.post('/user/phone/unbind', { password })
}

/**
 * 更换手机号
 */
export const changePhone = (
  newPhone: string,
  newCode: string,
  oldCode?: string
): Promise<{ code: number; msg?: string; data?: any }> => {
  return api.post('/user/phone/change', {
    new_phone: newPhone,
    new_code: newCode,
    old_code: oldCode,
  })
}

/**
 * 发送绑定验证码
 */
export const sendBindCode = (phone: string): Promise<{ code: number; msg?: string; data?: any }> => {
  return api.post('/user/phone/send-bind-code', { phone })
}