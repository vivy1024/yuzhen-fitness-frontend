/**
 * Token 管理工具
 * 简化版Token管理,用于新前端项目
 */

const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at'

/**
 * 设置Token
 */
export function setToken(token: string, refreshToken?: string, expiresIn?: number) {
  localStorage.setItem(TOKEN_KEY, token)
  
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
  
  if (expiresIn) {
    const expiresAt = Date.now() + expiresIn * 1000
    localStorage.setItem(TOKEN_EXPIRES_AT_KEY, expiresAt.toString())
  }
}

/**
 * 获取Token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 获取刷新Token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * 清除Token
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY)
  localStorage.removeItem('user_info')
  localStorage.removeItem('current_user_id')
}

/**
 * 检查Token是否存在
 */
export function hasToken(): boolean {
  return !!getToken()
}

/**
 * 检查Token是否过期
 */
export function isTokenExpired(): boolean {
  const expiresAtStr = localStorage.getItem(TOKEN_EXPIRES_AT_KEY)
  if (!expiresAtStr) return false
  
  const expiresAt = parseInt(expiresAtStr, 10)
  return Date.now() >= expiresAt
}
