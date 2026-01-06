import api from './auth'

export interface SmsResponse {
  code: number
  msg: string
  data?: any
}

/**
 * 发送手机验证码
 */
export const sendSmsCode = (phone: string): Promise<SmsResponse> => {
  return api.post('/auth/sms/send', { phone })
}

/**
 * 验证手机验证码
 */
export const verifySmsCode = (phone: string, code: string): Promise<SmsResponse> => {
  return api.post('/auth/sms/verify', { phone, code })
}

/**
 * 手机号验证码登录
 */
export const smsLogin = (phone: string, code: string): Promise<any> => {
  return api.post('/auth/sms/login', { phone, code })
}

/**
 * 检查手机号是否已注册
 */
export const checkPhone = (phone: string): Promise<SmsResponse> => {
  return api.get(`/auth/sms/check-phone?phone=${phone}`)
}
