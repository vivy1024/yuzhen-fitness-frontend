import api from './auth'

export interface EmailResponse {
  success: boolean
  message: string
  code?: string  // 错误码，如 EMAIL_RATE_LIMITED
  data?: {
    expires_at?: string
    wait_seconds?: number
    verified?: boolean
    exists?: boolean
  }
}

/**
 * 发送邮箱验证码
 * @param email 邮箱地址
 * @param type 验证码类型：register(注册), login(登录), reset(重置密码)
 */
export const sendEmailCode = (email: string, type: 'register' | 'login' | 'reset' = 'login'): Promise<EmailResponse> => {
  return api.post('/auth/email/send', { email, type })
}

/**
 * 验证邮箱验证码
 */
export const verifyEmailCode = (email: string, code: string): Promise<EmailResponse> => {
  return api.post('/auth/email/verify', { email, code })
}

/**
 * 邮箱验证码登录
 */
export const emailLogin = (email: string, code: string): Promise<any> => {
  return api.post('/auth/email/login', { email, code })
}

/**
 * 检查邮箱是否已注册
 */
export const checkEmailExists = (email: string): Promise<EmailResponse> => {
  return api.get('/auth/email/check', { params: { email } })
}

/**
 * 重置密码
 */
export interface ResetPasswordParams {
  email: string
  code: string
  password: string
  password_confirmation: string
}

export const resetPassword = (params: ResetPasswordParams): Promise<EmailResponse> => {
  return api.post('/auth/email/reset-password', params)
}
