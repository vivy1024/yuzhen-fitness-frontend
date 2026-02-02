/**
 * 管理员验证 API
 * 用于路由守卫中验证管理员身份
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
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

/**
 * 验证当前用户是否为管理员
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
      
      // 同步更新 localStorage 中的用户角色
      if (isAdmin) {
        const userInfo = localStorage.getItem('user_info')
        if (userInfo) {
          try {
            const user = JSON.parse(userInfo)
            user.role = response.data.data.role
            localStorage.setItem('user_info', JSON.stringify(user))
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
      
      return isAdmin
    }
    
    return false
  } catch (error) {
    console.warn('[AdminVerify] 验证失败，回退到本地检查:', error)
    
    // API 失败时回退到本地检查（降级策略）
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo)
        return user.role === 'admin'
      } catch (e) {
        return false
      }
    }
    return false
  }
}

/**
 * 清除管理员验证缓存
 * 在用户登出时调用
 */
export function clearAdminCache(): void {
  cachedResult = null
}
