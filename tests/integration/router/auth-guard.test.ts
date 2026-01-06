/**
 * 认证路由守卫测试
 * 
 * 测试路由守卫的认证逻辑
 * 
 * @module tests/integration/router/auth-guard
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createTestRouter,
  createTestPinia,
  setAuthenticated,
  setTermsAgreed,
  cleanupTestState,
  setupLocalStorageMock,
  cleanupLocalStorageMock
} from './setup'

describe('认证路由守卫测试', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(() => {
    setupLocalStorageMock()
    cleanupTestState()
    createTestPinia()
    router = createTestRouter()
  })

  afterEach(() => {
    cleanupTestState()
    cleanupLocalStorageMock()
  })

  describe('未认证用户', () => {
    beforeEach(() => {
      setAuthenticated(false)
    })

    it('访问需要认证的页面应该重定向到登录页', async () => {
      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/auth/login')
    })

    it('访问AI聊天页面应该重定向到登录页', async () => {
      await router.push('/ai/chat')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/auth/login')
    })

    it('访问用户档案页面应该重定向到登录页', async () => {
      await router.push('/user-profile')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/auth/login')
    })

    it('访问训练计划页面应该重定向到登录页', async () => {
      await router.push('/training/plans')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/auth/login')
    })

    it('访问动作库页面应该重定向到登录页', async () => {
      await router.push('/exercise')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/auth/login')
    })

    it('访问食物库页面应该重定向到登录页', async () => {
      await router.push('/food')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/auth/login')
    })

    it('访问设置页面应该重定向到登录页', async () => {
      await router.push('/settings')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/auth/login')
    })

    it('可以访问登录页面', async () => {
      await router.push('/auth/login')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/auth/login')
    })

    it('可以访问注册页面', async () => {
      await router.push('/auth/register')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/auth/register')
    })

    it('可以访问服务条款页面', async () => {
      await router.push('/legal/terms')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/legal/terms')
    })
  })

  describe('已认证用户', () => {
    beforeEach(() => {
      setAuthenticated(true)
      setTermsAgreed(true)
    })

    it('可以访问首页', async () => {
      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('可以访问AI聊天页面', async () => {
      await router.push('/ai/chat')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/ai/chat')
    })

    it('可以访问用户档案页面', async () => {
      await router.push('/user-profile')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/user-profile')
    })

    it('可以访问训练计划页面', async () => {
      await router.push('/training/plans')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/training/plans')
    })

    it('可以访问训练计划详情页面', async () => {
      await router.push('/training/plans/1')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/training/plans/1')
      expect(router.currentRoute.value.params.id).toBe('1')
    })

    it('可以访问动作库页面', async () => {
      await router.push('/exercise')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/exercise')
    })

    it('可以访问动作详情页面', async () => {
      await router.push('/exercise/123')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/exercise/123')
      expect(router.currentRoute.value.params.id).toBe('123')
    })

    it('可以访问食物库页面', async () => {
      await router.push('/food')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/food')
    })

    it('可以访问食物详情页面', async () => {
      await router.push('/food/456')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/food/456')
      expect(router.currentRoute.value.params.id).toBe('456')
    })

    it('访问登录页面应该重定向到首页', async () => {
      await router.push('/auth/login')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('访问注册页面应该重定向到首页', async () => {
      await router.push('/auth/register')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })
  })

  describe('首次使用检查', () => {
    beforeEach(() => {
      setAuthenticated(true)
    })

    it('未同意服务条款应该重定向到条款页面', async () => {
      setTermsAgreed(false)
      
      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/legal/terms')
    })

    it('已同意服务条款可以正常访问', async () => {
      setTermsAgreed(true)
      
      await router.push('/')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })

    it('未同意条款时访问条款页面不会循环重定向', async () => {
      setTermsAgreed(false)
      
      await router.push('/legal/terms')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/legal/terms')
    })
  })
})
