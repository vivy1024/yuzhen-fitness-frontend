/**
 * Token管理工具单元测试
 * 
 * 测试Token的存储、获取、清除、过期检测
 * 
 * @module tests/unit/utils/token
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  setToken,
  getToken,
  getRefreshToken,
  clearToken,
  hasToken,
  isTokenExpired
} from '@/utils/token'

describe('Token Utils', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value }),
      removeItem: vi.fn((key: string) => { delete store[key] }),
      clear: vi.fn(() => { store = {} })
    }
  })()

  beforeEach(() => {
    vi.stubGlobal('localStorage', localStorageMock)
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('setToken', () => {
    it('应该正确设置access token', () => {
      setToken('test_access_token')
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'test_access_token')
    })

    it('应该正确设置refresh token', () => {
      setToken('test_access_token', 'test_refresh_token')
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'test_access_token')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('refresh_token', 'test_refresh_token')
    })

    it('应该正确设置过期时间', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)
      
      setToken('test_token', undefined, 3600) // 1小时
      
      const expectedExpiry = now + 3600 * 1000
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'token_expires_at',
        expectedExpiry.toString()
      )
    })
  })

  describe('getToken', () => {
    it('应该返回存储的token', () => {
      localStorageMock.getItem.mockReturnValueOnce('stored_token')
      
      const token = getToken()
      
      expect(token).toBe('stored_token')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('access_token')
    })

    it('应该返回null - 无token', () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      
      expect(getToken()).toBeNull()
    })
  })

  describe('getRefreshToken', () => {
    it('应该返回存储的refresh token', () => {
      localStorageMock.getItem.mockReturnValueOnce('stored_refresh_token')
      
      const token = getRefreshToken()
      
      expect(token).toBe('stored_refresh_token')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('refresh_token')
    })
  })

  describe('clearToken', () => {
    it('应该清除所有token相关数据', () => {
      clearToken()
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refresh_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token_expires_at')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_info')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('current_user_id')
    })
  })

  describe('hasToken', () => {
    it('应该返回true - 有token', () => {
      localStorageMock.getItem.mockReturnValueOnce('some_token')
      
      expect(hasToken()).toBe(true)
    })

    it('应该返回false - 无token', () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      
      expect(hasToken()).toBe(false)
    })

    it('应该返回false - 空字符串token', () => {
      localStorageMock.getItem.mockReturnValueOnce('')
      
      expect(hasToken()).toBe(false)
    })
  })

  describe('isTokenExpired', () => {
    it('应该返回false - 无过期时间', () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      
      expect(isTokenExpired()).toBe(false)
    })

    it('应该返回false - token未过期', () => {
      const futureTime = Date.now() + 3600000 // 1小时后
      localStorageMock.getItem.mockReturnValueOnce(futureTime.toString())
      
      expect(isTokenExpired()).toBe(false)
    })

    it('应该返回true - token已过期', () => {
      const pastTime = Date.now() - 3600000 // 1小时前
      localStorageMock.getItem.mockReturnValueOnce(pastTime.toString())
      
      expect(isTokenExpired()).toBe(true)
    })
  })
})
