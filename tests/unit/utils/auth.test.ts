/**
 * 认证工具函数单元测试
 * 
 * 测试JWT解析、Token验证、邮箱验证、密码强度验证
 * 
 * @module tests/unit/utils/auth
 */

import { describe, it, expect } from 'vitest'
import {
  parseJWTPayload,
  isTokenExpired,
  isTokenExpiringSoon,
  isTokenValid,
  validateEmail,
  validatePasswordStrength
} from '@/utils/auth'

describe('Auth Utils', () => {
  // 创建测试用的JWT Token
  const createTestToken = (payload: object): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const body = btoa(JSON.stringify(payload))
    const signature = 'test_signature'
    return `${header}.${body}.${signature}`
  }

  describe('parseJWTPayload', () => {
    it('应该正确解析有效的JWT Token', () => {
      const payload = { sub: '123', exp: 1234567890, name: 'Test User' }
      const token = createTestToken(payload)
      
      const result = parseJWTPayload(token)
      expect(result).toEqual(payload)
    })

    it('应该返回null - 空Token', () => {
      expect(parseJWTPayload(null)).toBeNull()
      expect(parseJWTPayload('')).toBeNull()
    })

    it('应该返回null - 无效格式Token', () => {
      expect(parseJWTPayload('invalid')).toBeNull()
      expect(parseJWTPayload('only.two')).toBeNull()
      expect(parseJWTPayload('too.many.parts.here')).toBeNull()
    })
  })

  describe('isTokenExpired', () => {
    it('应该返回false - Token未过期', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600 // 1小时后
      const token = createTestToken({ exp: futureExp })
      
      expect(isTokenExpired(token)).toBe(false)
    })

    it('应该返回true - Token已过期', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600 // 1小时前
      const token = createTestToken({ exp: pastExp })
      
      expect(isTokenExpired(token)).toBe(true)
    })

    it('应该返回true - 空Token', () => {
      expect(isTokenExpired(null)).toBe(true)
    })

    it('应该返回true - 无exp字段', () => {
      const token = createTestToken({ sub: '123' })
      expect(isTokenExpired(token)).toBe(true)
    })
  })

  describe('isTokenExpiringSoon', () => {
    it('应该返回false - Token还有足够时间', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600 // 1小时后
      const token = createTestToken({ exp: futureExp })
      
      expect(isTokenExpiringSoon(token, 300)).toBe(false) // 5分钟阈值
    })

    it('应该返回true - Token即将过期', () => {
      const soonExp = Math.floor(Date.now() / 1000) + 120 // 2分钟后
      const token = createTestToken({ exp: soonExp })
      
      expect(isTokenExpiringSoon(token, 300)).toBe(true) // 5分钟阈值
    })

    it('应该返回true - 空Token', () => {
      expect(isTokenExpiringSoon(null)).toBe(true)
    })

    it('应该使用默认阈值', () => {
      const soonExp = Math.floor(Date.now() / 1000) + 200 // 约3分钟后
      const token = createTestToken({ exp: soonExp })
      
      // 默认阈值是300秒（5分钟）
      expect(isTokenExpiringSoon(token)).toBe(true)
    })
  })

  describe('isTokenValid', () => {
    it('应该返回true - 有效格式Token', () => {
      const token = createTestToken({ sub: '123' })
      expect(isTokenValid(token)).toBe(true)
    })

    it('应该返回false - 空Token', () => {
      expect(isTokenValid(null)).toBe(false)
      expect(isTokenValid('')).toBe(false)
    })

    it('应该返回false - 无效格式', () => {
      expect(isTokenValid('invalid')).toBe(false)
      expect(isTokenValid('only.two')).toBe(false)
    })
  })

  describe('validateEmail', () => {
    it('应该返回true - 有效邮箱', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.org')).toBe(true)
      expect(validateEmail('user+tag@example.co.uk')).toBe(true)
    })

    it('应该返回false - 无效邮箱', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('no@domain')).toBe(false)
      expect(validateEmail('@nodomain.com')).toBe(false)
      expect(validateEmail('spaces in@email.com')).toBe(false)
    })
  })

  describe('validatePasswordStrength', () => {
    it('应该返回valid - 符合要求的密码', () => {
      const result = validatePasswordStrength('Password123')
      expect(result.valid).toBe(true)
    })

    it('应该返回invalid - 密码太短', () => {
      const result = validatePasswordStrength('Pass1')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('8')
    })

    it('应该返回invalid - 密码太长', () => {
      const result = validatePasswordStrength('a'.repeat(33) + '1')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('32')
    })

    it('应该返回invalid - 缺少数字', () => {
      const result = validatePasswordStrength('PasswordOnly')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('数字')
    })

    it('应该返回invalid - 缺少字母', () => {
      const result = validatePasswordStrength('12345678')
      expect(result.valid).toBe(false)
      expect(result.message).toContain('字母')
    })

    it('应该接受边界长度密码', () => {
      // 8个字符
      expect(validatePasswordStrength('Passwo1d').valid).toBe(true)
      // 32个字符
      expect(validatePasswordStrength('a'.repeat(31) + '1').valid).toBe(true)
    })
  })
})
