/**
 * 路由测试设置
 * 
 * 配置路由测试的辅助函数和Mock
 * 
 * @module tests/integration/router/setup
 */

import { createRouter, createWebHistory, type Router } from 'vue-router'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { vi } from 'vitest'

// Mock token工具
export const mockHasToken = vi.fn(() => false)

vi.mock('@/utils/token', () => ({
  hasToken: () => mockHasToken(),
  getToken: vi.fn(() => mockHasToken() ? 'mock-token' : null),
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getRefreshToken: vi.fn(() => 'mock-refresh-token')
}))

// localStorage mock数据存储
let localStorageMock: Record<string, string> = {}

// 创建localStorage stub
export function setupLocalStorageMock() {
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
  return localStorageStub
}

// 清理localStorage mock
export function cleanupLocalStorageMock() {
  localStorageMock = {}
  vi.unstubAllGlobals()
}

// 创建测试路由
export function createTestRouter(): Router {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        name: 'home',
        component: { template: '<div>Home</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/ai/chat',
        name: 'ai-chat',
        component: { template: '<div>AI Chat</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/auth/login',
        name: 'login',
        component: { template: '<div>Login</div>' }
      },
      {
        path: '/auth/register',
        name: 'register',
        component: { template: '<div>Register</div>' }
      },
      {
        path: '/user-profile',
        name: 'user-profile',
        component: { template: '<div>User Profile</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/training/plans',
        name: 'training-plans',
        component: { template: '<div>Training Plans</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/training/plans/:id',
        name: 'training-plan-detail',
        component: { template: '<div>Training Plan Detail</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/exercise',
        name: 'exercise-library',
        component: { template: '<div>Exercise Library</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/exercise/:id',
        name: 'exercise-detail',
        component: { template: '<div>Exercise Detail</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/food',
        name: 'food-library',
        component: { template: '<div>Food Library</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/food/:id',
        name: 'food-detail',
        component: { template: '<div>Food Detail</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/settings',
        name: 'settings',
        component: { template: '<div>Settings</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/membership',
        name: 'membership-center',
        component: { template: '<div>Membership</div>' },
        meta: { requiresAuth: true }
      },
      {
        path: '/legal/terms',
        name: 'legal-terms',
        component: { template: '<div>Terms</div>' }
      },
      {
        path: '/admin',
        name: 'admin-home',
        component: { template: '<div>Admin</div>' },
        meta: { requiresAuth: true, requiresAdmin: true }
      }
    ]
  })

  // 路由守卫
  router.beforeEach((to, from, next) => {
    const isAuthenticated = mockHasToken()
    
    // 需要认证的页面
    if (to.meta.requiresAuth && !isAuthenticated) {
      next('/auth/login')
    }
    // 已登录用户访问登录/注册页面，重定向到首页
    else if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
      next('/')
    }
    // 管理员权限检查
    else if (to.meta.requiresAdmin && isAuthenticated) {
      const userInfo = localStorageMock['user_info']
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo)
          if (user.role !== 'admin') {
            next('/')
            return
          }
        } catch (e) {
          next('/')
          return
        }
      } else {
        next('/')
        return
      }
      next()
    }
    // 首次使用检查
    else if (to.meta.requiresAuth && isAuthenticated && to.name !== 'legal-terms') {
      const hasAgreedTerms = localStorageMock['yuzhen_terms_agreed'] === 'true'
      if (!hasAgreedTerms) {
        next('/legal/terms')
      } else {
        next()
      }
    }
    else {
      next()
    }
  })

  return router
}

// 创建测试Pinia
export function createTestPinia(): Pinia {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}

// 设置认证状态
export function setAuthenticated(authenticated: boolean) {
  mockHasToken.mockReturnValue(authenticated)
}

// 设置管理员状态
export function setAdminUser(isAdmin: boolean) {
  localStorageMock['user_info'] = JSON.stringify({ id: 1, role: isAdmin ? 'admin' : 'user' })
}

// 设置服务条款同意状态
export function setTermsAgreed(agreed: boolean) {
  if (agreed) {
    localStorageMock['yuzhen_terms_agreed'] = 'true'
  } else {
    delete localStorageMock['yuzhen_terms_agreed']
  }
}

// 清理测试状态
export function cleanupTestState() {
  mockHasToken.mockReturnValue(false)
  localStorageMock = {}
}
