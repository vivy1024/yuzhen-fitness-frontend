import { createRouter, createWebHistory } from 'vue-router'
import { hasToken } from '@/utils/token'

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
      path: '/training/plans/:id',
      name: 'training-plan-detail',
      component: () => import('@/views/training/plan-detail.vue'),
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
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = hasToken()
  
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
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        if (user.role !== 'admin') {
          next('/')  // 非管理员重定向到首页
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
  // 首次使用检查（已登录用户访问需要认证的页面时）
  else if (to.meta.requiresAuth && isAuthenticated && to.name !== 'legal-terms') {
    const hasAgreedTerms = localStorage.getItem('yuzhen_terms_agreed') === 'true'
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

export default router
