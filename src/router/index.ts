import { createRouter, createWebHistory } from 'vue-router'
import { hasToken } from '@/utils/token'
import { verifyAdmin, isSensitiveRoute } from '@/api/admin/verify'
import { getTokenManager } from '@/utils/token-manager'
import { isTokenExpired, isTokenExpiringSoon } from '@/utils/auth'
import logger from '@/utils/logger'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/home.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ai/chat',
      name: 'ai-chat',
      component: () => import('@/views/ai/chat.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/auth',
      children: [
        {
          path: 'login',
          name: 'login',
          component: () => import('@/views/auth/login.vue')
        },
        {
          path: 'register',
          name: 'register',
          component: () => import('@/views/auth/register.vue')
        },
        {
          path: 'forgot-password',
          name: 'forgot-password',
          component: () => import('@/views/auth/forgot-password.vue')
        }
      ]
    },
    {
      path: '/user-profile',
      name: 'user-profile',
      component: () => import('@/views/user/profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/user-profile/edit',
      name: 'user-profile-edit',
      component: () => import('@/views/user/edit.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/legal/terms',
      name: 'legal-terms',
      component: () => import('@/views/legal/terms.vue')
    },
    {
      path: '/training',
      name: 'training',
      component: () => import('@/views/training/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/training/plans',
      name: 'training-plans',
      component: () => import('@/views/training/plans.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/training/plans/create',
      name: 'training-plan-create',
      component: () => import('@/views/training/plan-create.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/training/plans/:id/edit',
      name: 'training-plan-edit',
      component: () => import('@/views/training/plan-create.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/training/plans/:id',
      name: 'training-plan-detail',
      component: () => import('@/views/training/plan-detail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/training/templates',
      name: 'training-templates',
      component: () => import('@/views/training/templates.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/training/session',
      name: 'training-session',
      component: () => import('@/views/training/session.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/training/history',
      name: 'training-history',
      component: () => import('@/views/training/history.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/training/stats',
      name: 'training-stats',
      component: () => import('@/views/training/stats.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/training/progress',
      name: 'training-progress',
      component: () => import('@/views/progress/dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/exercise',
      name: 'exercise-library',
      component: () => import('@/views/exercise/library.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/exercise/:id',
      name: 'exercise-detail',
      component: () => import('@/views/exercise/detail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/food',
      name: 'food-library',
      component: () => import('@/views/food/library.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/food/:id',
      name: 'food-detail',
      component: () => import('@/views/food/detail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/progress',
      name: 'progress-dashboard',
      redirect: '/training/progress',  // 重定向到新路径
    },
    {
      path: '/ai-advisor',
      name: 'ai-advisor',
      redirect: '/ai/chat',  // 重定向到正确的AI聊天路径
    },
    {
      path: '/membership',
      name: 'membership-center',
      component: () => import('@/views/membership/center.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/me',
      name: 'me',
      component: () => import('@/views/me/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/settings/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings/about',
      name: 'settings-about',
      component: () => import('@/views/settings/about.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import('@/views/notifications/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/help',
      name: 'help-center',
      component: () => import('@/views/help/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/help/:id',
      name: 'help-detail',
      component: () => import('@/views/help/detail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/feedback',
      name: 'feedback',
      component: () => import('@/views/feedback/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/knowledge',
      name: 'Knowledge',
      component: () => import('@/views/knowledge/index.vue'),
      meta: { requiresAuth: true, title: '知识库' }
    },
    {
      path: '/knowledge/cards',
      name: 'KnowledgeCards',
      component: () => import('@/views/knowledge/cards.vue'),
      meta: { requiresAuth: true, title: '知识卡片' }
    },
    {
      path: '/knowledge/:id',
      name: 'KnowledgeDetail',
      component: () => import('@/views/knowledge/detail.vue'),
      meta: { requiresAuth: true, title: '知识详情' }
    },
    // 管理员路由
    {
      path: '/admin',
      children: [
        {
          path: '',
          name: 'admin-home',
          component: () => import('@/views/admin/index.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('@/views/admin/orders.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'ai-monitor',
          name: 'admin-ai-monitor',
          component: () => import('@/views/admin/ai-monitor.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'expert-review',
          name: 'admin-expert-review',
          component: () => import('@/views/admin/expert-review.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/users.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'feedback',
          name: 'admin-feedback',
          component: () => import('@/views/admin/feedback.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        // 监控Dashboard路由
        {
          path: 'dashboards/performance',
          name: 'admin-dashboard-performance',
          component: () => import('@/views/admin/dashboards/performance.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'dashboards/streaming',
          name: 'admin-dashboard-streaming',
          component: () => import('@/views/admin/dashboards/streaming.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'dashboards/workflow',
          name: 'admin-dashboard-workflow',
          component: () => import('@/views/admin/dashboards/workflow.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'dashboards/logs',
          name: 'admin-dashboard-logs',
          component: () => import('@/views/admin/dashboards/logs.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        }
      ]
    },
    // 法律页面
    {
      path: '/legal/privacy',
      name: 'legal-privacy',
      component: () => import('@/views/legal/privacy.vue')
    },
    // 404 兜底路由（必须放在最后）
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/error/not-found.vue')
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const isAuthenticated = hasToken()
  const tokenManager = getTokenManager()
  const token = tokenManager.getAccessToken()
  
  // 需要认证的页面 - 增强Token验证
  if (to.meta.requiresAuth) {
    // 检查Token是否存在
    if (!isAuthenticated || !token) {
      logger.sensitive('[Router] 无Token，重定向到登录页')
      next('/auth/login')
      return
    }
    
    // 检查Token是否已过期
    if (isTokenExpired(token)) {
      logger.sensitive('[Router] Token已过期，清除并重定向到登录页')
      tokenManager.clearTokens()
      next('/auth/login')
      return
    }
    
    // 检查Token是否即将过期（5分钟内），尝试自动刷新（带超时保护）
    if (isTokenExpiringSoon(token, 300)) {
      logger.sensitive('[Router] Token即将过期，尝试刷新...')
      try {
        const refreshPromise = tokenManager.refreshToken()
        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000))
        const refreshed = await Promise.race([refreshPromise, timeoutPromise])
        if (!refreshed) {
          logger.sensitive('[Router] Token刷新失败或超时，重定向到登录页')
          tokenManager.clearTokens()
          next('/auth/login')
          return
        }
      } catch {
        logger.sensitive('[Router] Token刷新异常，重定向到登录页')
        tokenManager.clearTokens()
        next('/auth/login')
        return
      }
    }
  }
  
  // 已登录用户访问登录/注册页面，重定向到首页
  if ((to.name === 'login' || to.name === 'register') && isAuthenticated) {
    next('/')
    return
  }
  
  // 管理员权限检查 - 调用后端API验证（带超时保护）
  if (to.meta.requiresAdmin && isAuthenticated) {
    try {
      // 敏感路由强制刷新验证
      const forceRefresh = isSensitiveRoute(to.name as string)
      const verifyPromise = verifyAdmin(forceRefresh)
      const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000))
      const isAdmin = await Promise.race([verifyPromise, timeoutPromise])
      if (!isAdmin) {
        next('/')  // 非管理员重定向到首页
        return
      }
    } catch (e) {
      logger.error('[Router] 管理员验证失败:', e)
      next('/')
      return
    }
  }
  
  // 首次使用检查（已登录用户访问需要认证的页面时）
  if (to.meta.requiresAuth && isAuthenticated && to.name !== 'legal-terms') {
    const hasAgreedTerms = localStorage.getItem('yuzhen_terms_agreed') === 'true'
    if (!hasAgreedTerms) {
      next('/legal/terms')
      return
    }
  }
  
  next()
})

export default router
