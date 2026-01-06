/**
 * 设置相关API
 * 
 * @author 玉珍健身 v3.0
 * @created 2026-01-06
 */

import api, { logout as authLogout } from './auth'

// 类型定义
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    training: boolean
    nutrition: boolean
    system: boolean
  }
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export interface CacheInfo {
  total_size: string
  items: {
    name: string
    size: string
    type: string
  }[]
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// API函数

/**
 * 获取用户设置
 */
export function getSettings(): Promise<ApiResponse<AppSettings>> {
  return api.get('/settings')
}

/**
 * 更新用户设置
 */
export function updateSettings(settings: Partial<AppSettings>): Promise<ApiResponse<AppSettings>> {
  return api.put('/settings', settings)
}

/**
 * 修改密码
 */
export function changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
  return api.post('/user/change-password', data)
}

/**
 * 删除账号
 */
export function deleteAccount(password: string): Promise<ApiResponse<{ message: string }>> {
  return api.delete('/user/account', { data: { password } })
}

/**
 * 退出登录
 */
export const logout = authLogout

/**
 * 获取缓存信息
 */
export function getCacheInfo(): Promise<ApiResponse<CacheInfo>> {
  return api.get('/cache/info')
}

/**
 * 清除缓存
 */
export function clearCache(type?: string): Promise<ApiResponse<{ message: string }>> {
  return api.post('/cache/clear', { type })
}

/**
 * 获取应用版本信息
 */
export function getAppVersion(): Promise<ApiResponse<{
  version: string
  build: string
  api_version: string
}>> {
  return api.get('/version')
}
