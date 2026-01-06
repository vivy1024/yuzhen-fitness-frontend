/**
 * Authentication Utilities
 * 认证工具函数
 * 
 * 提供 Token 验证、密码强度验证等工具函数
 * 复刻自v2项目
 * 
 * @module utils/auth
 * @version 1.0.0
 */

export interface JWTPayload {
  sub?: string | number
  exp?: number
  iat?: number
  [key: string]: any
}

/**
 * Token 相关常量
 */
const TOKEN_CONFIG = {
  /** Token 即将过期阈值（秒） */
  EXPIRING_THRESHOLD: 300, // 5分钟
  /** 登录有效期（秒） */
  LOGIN_VALIDITY: 7 * 24 * 60 * 60, // 7天
} as const

/**
 * 解析 JWT Token 载荷
 */
export function parseJWTPayload(token: string | null): JWTPayload | null {
  if (!token) return null
  
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payloadBase64 = parts[1]
    const payloadJson = atob(payloadBase64)
    return JSON.parse(payloadJson) as JWTPayload
  } catch (error) {
    console.error('Failed to parse JWT token:', error)
    return null
  }
}

/**
 * 检查 Token 是否已过期
 */
export function isTokenExpired(token: string | null): boolean {
  const payload = parseJWTPayload(token)
  if (!payload || !payload.exp) return true
  
  const expirationTime = payload.exp * 1000
  return Date.now() >= expirationTime
}

/**
 * 检查 Token 是否即将过期
 */
export function isTokenExpiringSoon(
  token: string | null,
  threshold: number = TOKEN_CONFIG.EXPIRING_THRESHOLD
): boolean {
  const payload = parseJWTPayload(token)
  if (!payload || !payload.exp) return true
  
  const expirationTime = payload.exp * 1000
  const thresholdMs = threshold * 1000
  
  return expirationTime - Date.now() < thresholdMs
}

/**
 * 检查 Token 格式是否有效
 */
export function isTokenValid(token: string | null): boolean {
  if (!token) return false
  const parts = token.split('.')
  return parts.length === 3
}

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return EMAIL_PATTERN.test(email)
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  message: string
} {
  if (password.length < 8) {
    return { valid: false, message: '密码长度不能少于8个字符' }
  }
  if (password.length > 32) {
    return { valid: false, message: '密码长度不能超过32个字符' }
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(password)) {
    return { valid: false, message: '密码必须包含至少一个字母和一个数字' }
  }
  return { valid: true, message: '密码强度符合要求' }
}

export const authUtils = {
  parseJWTPayload,
  isTokenExpired,
  isTokenExpiringSoon,
  isTokenValid,
  validateEmail,
  validatePasswordStrength,
}

export default authUtils
