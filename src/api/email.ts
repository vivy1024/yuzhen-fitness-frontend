import api from './auth'
import type { ApiResponse } from './auth'

export interface EmailData {
  expires_at?: string
  wait_seconds?: number
  verified?: boolean
  exists?: boolean
}

/** @deprecated 使用 ApiResponse<EmailData> 替代 */
export interface EmailResponse {
  success: boolean
  message: string
  code?: string
  data?: EmailData
}

/**
 * 发送邮箱验证码
 * @param email 邮箱地址
 * @param type 验证码类型：register(注册), login(登录), reset(重置密码)
 */
export const sendEmailCode = (email: string, type: 'register' | 'login' | 'reset' = 'login'): Promise<ApiResponse<EmailData>> => {
  return api.post('/auth/email/send', { email, type })
}

/**
 * 验证邮箱验证码
 */
export const verifyEmailCode = (email: string, code: string): Promise<ApiResponse<EmailData>> => {
  return api.post('/auth/email/verify', { email, code })
}

/**
 * 邮箱验证码登录
 */
export const emailLogin = (email: string, code: string): Promise<ApiResponse<EmailData>> => {
  return api.post('/auth/email/login', { email, code })
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

export const resetPassword = (params: ResetPasswordParams): Promise<ApiResponse<EmailData>> => {
  return api.post('/auth/email/reset-password', params)
}
