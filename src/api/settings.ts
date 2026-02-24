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
 * 获取缓存信息（本地降级：读取 localStorage 大小）
 */
export function getCacheInfo(): Promise<ApiResponse<CacheInfo>> {
  const items: CacheInfo['items'] = []
  let totalBytes = 0

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const value = localStorage.getItem(key) || ''
      const size = new Blob([value]).size
      totalBytes += size
      items.push({
        name: key,
        size: size > 1024 ? `${(size / 1024).toFixed(1)}KB` : `${size}B`,
        type: 'localStorage',
      })
    }
  }

  return Promise.resolve({
    code: 200,
    msg: '获取成功',
    data: {
      total_size: totalBytes > 1024 ? `${(totalBytes / 1024).toFixed(1)}KB` : `${totalBytes}B`,
      items,
    },
  })
}

/**
 * 清除缓存（本地降级：清理 localStorage）
 */
export function clearCache(_type?: string): Promise<ApiResponse<{ message: string }>> {
  localStorage.clear()
  return Promise.resolve({
    code: 200,
    msg: '操作成功',
    data: { message: '本地缓存已清除' },
  })
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
