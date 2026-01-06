/**
 * Auth Store测试
 * 
 * 测试认证状态管理的核心逻辑
 * 
 * @module tests/unit/stores/auth
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// Mock API模块
vi.mock('@/api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn()
}))

// Mock token工具
vi.mock('@/utils/token', () => ({
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getRefreshToken: vi.fn(() => 'mock-refresh-token')
}))

// Mock token-manager
vi.mock('@/utils/token-manager', () => ({
  getTokenManager: vi.fn(() => ({
    setRefreshTokenApi: vi.fn(),
    onTokenExpired: vi.fn(),
    setTokens: vi.fn(),
    startAutoRefresh: vi.fn(),
    stopAutoRefresh: vi.fn(),
    clearTokens: vi.fn()
  }))
}))

// Mock warmup API
vi.mock('@/api/warmup', () => ({
  warmupUser: vi.fn(() => Promise.resolve({ success: true }))
}))

// Mock 关联stores
vi.mock('@/stores/user', () => ({
  useUserStore: vi.fn(() => ({
    init: vi.fn(() => Promise.resolve()),
    resetProfile: vi.fn()
  }))
}))

vi.mock('@/stores/membership', () => ({
  useMembershipStore: vi.fn(() => ({
    init: vi.fn(() => Promise.resolve()),
    clearMembership: vi.fn()
  }))
}))

vi.mock('@/stores/topic', () => ({
  useTopicStore: vi.fn(() => ({
    init: vi.fn(() => Promise.resolve()),
    clearTopics: vi.fn()
  }))
}))

describe('Auth Store', () => {
  let store: ReturnType<typeof useAuthStore>
  let localStorageMock: Record<string, string>

  beforeEach(() => {
    // 创建新的Pinia实例
    setActivePinia(createPinia())
    
    // Mock localStorage using stubGlobal
    localStorageMock = {}
    const localStorageStub = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => { localStorageMock[key] = value }),
      removeItem: vi.fn((key: string) => { delete localStorageMock[key] }),
      clear: vi.fn(() => { localStorageMock = {} }),
      length: 0,
      key: vi.fn()
    }
    vi.stubGlobal('localStorage', localStorageStub)
    
    store = useAuthStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.loading).toBe(false)
    })
  })

  describe('计算属性', () => {
    it('userName应该返回空字符串当没有用户时', () => {
      expect(store.userName).toBe('')
    })

    it('userName应该优先返回nickname', () => {
      store.user = { id: 1, name: 'Test', email: 'test@test.com', nickname: 'TestNick' }
      expect(store.userName).toBe('TestNick')
    })

    it('userName应该返回name当没有nickname时', () => {
      store.user = { id: 1, name: 'Test', email: 'test@test.com' }
      expect(store.userName).toBe('Test')
    })

    it('userEmail应该返回用户邮箱', () => {
      store.user = { id: 1, name: 'Test', email: 'test@test.com' }
      expect(store.userEmail).toBe('test@test.com')
    })

    it('isAdmin应该正确判断管理员角色', () => {
      store.user = { id: 1, name: 'Test', email: 'test@test.com', role: 'admin' }
      expect(store.isAdmin).toBe(true)
      
      store.user = { id: 1, name: 'Test', email: 'test@test.com', role: 'user' }
      expect(store.isAdmin).toBe(false)
    })
  })

  describe('init方法', () => {
    it('应该从localStorage恢复用户信息', async () => {
      const mockUser = { id: 1, name: 'Test', email: 'test@test.com' }
      localStorageMock['user_info'] = JSON.stringify(mockUser)
      
      await store.init()
      
      expect(store.user).toEqual(mockUser)
      expect(store.isAuthenticated).toBe(true)
    })

    it('应该处理无效的localStorage数据', async () => {
      localStorageMock['user_info'] = 'invalid-json'
      
      // Mock console.error to suppress expected error output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      await store.init()
      
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalled()
      
      consoleErrorSpy.mockRestore()
    })

    it('应该在没有存储数据时保持未认证状态', async () => {
      await store.init()
      
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('logout方法', () => {
    it('应该清除用户状态', async () => {
      // 设置初始状态
      store.user = { id: 1, name: 'Test', email: 'test@test.com' }
      store.isAuthenticated = true
      
      await store.logout()
      
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })
})
