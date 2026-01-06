/**
 * 管理员路由守卫测试
 * 
 * 测试管理员权限路由守卫
 * 
 * @module tests/integration/router/admin-guard
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createTestRouter,
  createTestPinia,
  setAuthenticated,
  setAdminUser,
  setTermsAgreed,
  cleanupTestState,
  setupLocalStorageMock,
  cleanupLocalStorageMock
} from './setup'

describe('管理员路由守卫测试', () => {
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

  describe('管理员用户', () => {
    beforeEach(() => {
      setAdminUser(true)
    })

    it('可以访问管理员页面', async () => {
      await router.push('/admin')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/admin')
    })
  })

  describe('普通用户', () => {
    beforeEach(() => {
      setAdminUser(false)
    })

    it('访问管理员页面应该重定向到首页', async () => {
      await router.push('/admin')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })
  })

  describe('无用户信息', () => {
    // 不设置任何用户信息，cleanupTestState已经清空了

    it('访问管理员页面应该重定向到首页', async () => {
      await router.push('/admin')
      await router.isReady()

      expect(router.currentRoute.value.path).toBe('/')
    })
  })
})
