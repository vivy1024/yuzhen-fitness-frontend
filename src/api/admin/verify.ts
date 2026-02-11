/**
 * 管理员验证 API
 * 用于路由守卫中验证管理员身份
 * 
 * 安全修复：移除localStorage降级逻辑，API失败时拒绝访问
 */

import api from '@/api/auth'

interface AdminVerifyResponse {
  code: number
  msg: string
  data: {
    is_admin: boolean
    role: string
    permissions?: string[]
  } | null
}

// 缓存验证结果，避免频繁请求
let cachedResult: { isAdmin: boolean; timestamp: number } | null = null
// 缓存时间1分钟，提高安全性
const CACHE_DURATION = 1 * 60 * 1000 // 1分钟缓存

// 敏感路由列表，访问时强制刷新验证
const SENSITIVE_ROUTES = [
  'admin-users',
  'admin-orders',
  'admin-feedback'
]

/**
 * 检查是否为敏感路由
 * @param routeName 路由名称
 */
export function isSensitiveRoute(routeName: string): boolean {
  return SENSITIVE_ROUTES.includes(routeName)
}

/**
 * 验证当前用户是否为管理员
 * 安全修复：移除localStorage降级逻辑
 * @param forceRefresh 是否强制刷新（忽略缓存）
 */
export async function verifyAdmin(forceRefresh = false): Promise<boolean> {
  // 检查缓存
  if (!forceRefresh && cachedResult) {
    const now = Date.now()
    if (now - cachedResult.timestamp < CACHE_DURATION) {
      return cachedResult.isAdmin
    }
  }

  try {
    const response = await api.get<AdminVerifyResponse>('/admin/verify')
    
    if (response.data.code === 200 && response.data.data) {
      const isAdmin = response.data.data.is_admin === true
      
      // 更新缓存
      cachedResult = {
        isAdmin,
        timestamp: Date.now()
      }
      
      return isAdmin
    }
    
    // API返回非200，清除缓存并拒绝
    clearAdminCache()
    return false
    
  } catch (error) {
    // 安全修复：API失败时拒绝访问，不回退到localStorage
    console.error('[AdminVerify] 验证失败:', error)
    clearAdminCache()
    clearLocalAdminState()
    return false
  }
}

/**
 * 清除本地管理员状态
 * 安全修复：API失败时清除本地存储的管理员角色
 */
function clearLocalAdminState(): void {
  try {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      if (user.role === 'admin') {
        user.role = 'user'
        localStorage.setItem('user_info', JSON.stringify(user))
      }
    }
  } catch (e) {
    // 忽略解析错误
  }
}

/**
 * 清除管理员验证缓存
 * 在用户登出时调用
 */
export function clearAdminCache(): void {
  cachedResult = null
}
