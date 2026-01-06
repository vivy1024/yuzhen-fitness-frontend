/**
 * 路由导航测试
 * 
 * 测试页面间的导航和参数传递
 * 
 * @module tests/integration/router/navigation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createTestRouter,
  createTestPinia,
  setAuthenticated,
  setTermsAgreed,
  setAdminUser,
  cleanupTestState,
  setupLocalStorageMock,
  cleanupLocalStorageMock
} from './setup'

describe('路由导航测试', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(() => {
    setupLocalStorageMock()
    cleanupTestState()
    createTestPinia()
    router = createTestRouter()
    setAuthenticated(true)
    setTermsAgreed(true)
  })

  afterEach(() => {
    cleanupTestState()
    cleanupLocalStorageMock()
  })

  describe('基本导航', () => {
    it('应该能从首页导航到AI聊天', async () => {
      await router.push('/')
      await router.isReady()
      
      await router.push('/ai/chat')
      
      expect(router.currentRoute.value.path).toBe('/ai/chat')
      expect(router.currentRoute.value.name).toBe('ai-chat')
    })

    it('应该能从首页导航到用户档案', async () => {
      await router.push('/')
      await router.isReady()
      
      await router.push('/user-profile')
      
      expect(router.currentRoute.value.path).toBe('/user-profile')
      expect(router.currentRoute.value.name).toBe('user-profile')
    })

    it('应该能从首页导航到训练计划列表', async () => {
      await router.push('/')
      await router.isReady()
      
      await router.push('/training/plans')
      
      expect(router.currentRoute.value.path).toBe('/training/plans')
      expect(router.currentRoute.value.name).toBe('training-plans')
    })

    it('应该能从首页导航到动作库', async () => {
      await router.push('/')
      await router.isReady()
      
      await router.push('/exercise')
      
      expect(router.currentRoute.value.path).toBe('/exercise')
      expect(router.currentRoute.value.name).toBe('exercise-library')
    })

    it('应该能从首页导航到食物库', async () => {
      await router.push('/')
      await router.isReady()
      
      await router.push('/food')
      
      expect(router.currentRoute.value.path).toBe('/food')
      expect(router.currentRoute.value.name).toBe('food-library')
    })
  })

  describe('带参数的导航', () => {
    it('应该能导航到训练计划详情页并传递ID', async () => {
      await router.push('/training/plans/123')
      await router.isReady()
      
      expect(router.currentRoute.value.path).toBe('/training/plans/123')
      expect(router.currentRoute.value.params.id).toBe('123')
    })

    it('应该能导航到动作详情页并传递ID', async () => {
      await router.push('/exercise/456')
      await router.isReady()
      
      expect(router.currentRoute.value.path).toBe('/exercise/456')
      expect(router.currentRoute.value.params.id).toBe('456')
    })

    it('应该能导航到食物详情页并传递ID', async () => {
      await router.push('/food/789')
      await router.isReady()
      
      expect(router.currentRoute.value.path).toBe('/food/789')
      expect(router.currentRoute.value.params.id).toBe('789')
    })

    it('应该能使用命名路由导航', async () => {
      await router.push({ name: 'training-plan-detail', params: { id: '100' } })
      await router.isReady()
      
      expect(router.currentRoute.value.name).toBe('training-plan-detail')
      expect(router.currentRoute.value.params.id).toBe('100')
    })

    it('应该能使用命名路由导航到动作详情', async () => {
      await router.push({ name: 'exercise-detail', params: { id: '200' } })
      await router.isReady()
      
      expect(router.currentRoute.value.name).toBe('exercise-detail')
      expect(router.currentRoute.value.params.id).toBe('200')
    })
  })

  describe('导航历史', () => {
    // 注意：router.back(), router.go(), router.forward() 在测试环境中
    // 由于 happy-dom 的 history API 限制，行为可能不一致
    // 这些功能在真实浏览器中正常工作
    
    it('应该能使用router.forward()前进', async () => {
      await router.push('/')
      await router.isReady()
      
      await router.push('/ai/chat')
      
      router.back()
      await router.isReady()
      
      router.forward()
      await router.isReady()
      
      expect(router.currentRoute.value.path).toBe('/ai/chat')
    })
  })

  describe('路由替换', () => {
    it('应该能使用replace替换当前路由', async () => {
      await router.push('/')
      await router.isReady()
      
      await router.push('/ai/chat')
      await router.replace('/user-profile')
      
      // replace 成功替换当前路由
      expect(router.currentRoute.value.path).toBe('/user-profile')
    })
  })

  describe('路由元信息', () => {
    it('首页应该有requiresAuth元信息', async () => {
      await router.push('/')
      await router.isReady()
      
      expect(router.currentRoute.value.meta.requiresAuth).toBe(true)
    })

    it('登录页不应该有requiresAuth元信息', async () => {
      setAuthenticated(false)
      
      await router.push('/auth/login')
      await router.isReady()
      
      expect(router.currentRoute.value.meta.requiresAuth).toBeFalsy()
    })

    it('管理员页面应该有requiresAdmin元信息', async () => {
      setAdminUser(true)
      
      await router.push('/admin')
      await router.isReady()
      
      expect(router.currentRoute.value.meta.requiresAdmin).toBe(true)
    })
  })
})
