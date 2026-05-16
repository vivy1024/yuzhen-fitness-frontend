/**
 * 认证状态管理
 * 使用Pinia管理用户认证状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi, registerByPhone as registerByPhoneApi, logout as logoutApi, refreshToken as refreshTokenApi, type LoginCredentials, type RegisterData } from '@/api/auth'
import { setToken, clearToken, getRefreshToken, getToken } from '@/utils/token'
import { getTokenManager } from '@/utils/token-manager'
import { parseJWTPayload } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import { useMembershipStore } from '@/stores/membership'
import { useTopicStore } from '@/stores/topic'
// import { warmupUser } from '@/api/warmup' // 已废弃：YuzhenFork MCP 自动连接
import { smsLogin as smsLoginApi } from '@/api/sms'
import { showSuccess, showError } from '@/components/ui/toast'

export interface UserInfo {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  nickname?: string
  role?: string  // 用户角色：admin, user, expert
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<UserInfo | null>(null)
  const isAuthenticated = ref(false)
  const loading = ref(false)

  // Getters
  const userName = computed(() => user.value?.nickname || user.value?.name || user.value?.email || '')
  const userEmail = computed(() => user.value?.email || '')
  const userAvatar = computed(() => user.value?.avatar || '')
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Actions
  
  /**
   * 初始化认证状态
   */
  async function init() {
    // 初始化TokenManager并设置刷新API
    initTokenManager()
    
    const userInfoStr = localStorage.getItem('user_info')
    if (userInfoStr) {
      try {
        user.value = JSON.parse(userInfoStr)
        isAuthenticated.value = true
        
        // 从当前JWT解析权限Claims
        try {
          const token = getToken()
          if (token) {
            const payload = parseJWTPayload(token)
            if (payload?.tier || payload?.permissions) {
              const membershipStore = useMembershipStore()
              membershipStore.updatePermissionsFromJwt(payload)
            }
          }
        } catch (parseError) {
          // 解析失败不影响初始化
        }
        
        // 初始化关联的stores
        await initRelatedStores()
      } catch (error) {
        console.error('Failed to parse user info:', error)
        clearToken()
      }
    }
  }

  /**
   * 初始化TokenManager
   * 设置刷新Token的API函数和过期回调
   */
  function initTokenManager() {
    const tokenManager = getTokenManager()
    
    // 设置刷新Token的API函数
    tokenManager.setRefreshTokenApi(async () => {
      try {
        const refreshTokenValue = getRefreshToken()
        if (!refreshTokenValue) {
          console.warn('[TokenManager] 没有refresh_token，无法刷新')
          return null
        }
        
        // 调用后端刷新API
        const response = await refreshTokenApi()
        
        if (response.code === 200 && response.data) {
          // 同步更新localStorage中的token
          setToken(
            response.data.access_token,
            response.data.refresh_token,
            response.data.expires_in
          )
          
          console.log('[TokenManager] Token刷新成功，新过期时间:', response.data.expires_in, '秒')
          
          // 解析新JWT中的权限Claims并更新membership store
          try {
            const payload = parseJWTPayload(response.data.access_token)
            if (payload?.tier || payload?.permissions) {
              const membershipStore = useMembershipStore()
              membershipStore.updatePermissionsFromJwt(payload)
              console.log('[TokenManager] 已从JWT更新权限Claims:', { tier: payload.tier })
            }
          } catch (parseError) {
            console.warn('[TokenManager] 解析JWT权限Claims失败（不影响刷新）:', parseError)
          }
          
          return {
            token: response.data.access_token,
            expiresIn: response.data.expires_in
          }
        }
        
        return null
      } catch (error) {
        console.error('[TokenManager] 刷新Token失败:', error)
        return null
      }
    })
    
    // 设置Token过期回调 - 自动登出
    tokenManager.onTokenExpired(() => {
      console.log('[TokenManager] Token已过期，执行自动登出')
      user.value = null
      isAuthenticated.value = false
      clearToken()
      
      // 跳转到登录页（如果不在登录页）
      const currentPath = window.location.pathname
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        window.location.href = '/auth/login?expired=1'
      }
    })
    
    console.log('[Auth] TokenManager初始化完成，自动刷新已启用')
  }

  /**
   * 初始化关联的stores（用户档案、会员、话题、用量）
   */
  async function initRelatedStores() {
    const userStore = useUserStore()
    const membershipStore = useMembershipStore()
    const topicStore = useTopicStore()
    const { useUsageStore } = await import('@/stores/usage')
    const usageStore = useUsageStore()
    
    // 并行初始化
    await Promise.all([
      userStore.init(),
      membershipStore.init(),
      topicStore.init(),
      usageStore.init()
    ])
  }

  // warmupDamlRag 已废弃（YuzhenFork MCP 自动连接）

  /**
   * 认证成功后的统一处理流程
   * 所有登录/注册路径共享：Token保存 → store初始化 → JWT解析 → DAML-RAG预热
   */
  async function handleAuthSuccess(data: { user: any; access_token: string; refresh_token?: string; expires_in: number }, options?: { skipWarmup?: boolean }) {
    const refreshToken = data.refresh_token || ''
    // 保存Token到localStorage
    setToken(data.access_token, refreshToken, data.expires_in)

    // 同步Token到TokenManager
    const tokenManager = getTokenManager()
    tokenManager.setTokens(data.access_token, refreshToken, data.expires_in)
    tokenManager.startAutoRefresh()

    // 保存用户信息
    user.value = data.user
    isAuthenticated.value = true
    localStorage.setItem('user_info', JSON.stringify(data.user))

    if (data.user.id) {
      localStorage.setItem('current_user_id', data.user.id.toString())
    }

    // 初始化关联stores
    await initRelatedStores()

    // 解析JWT中的权限Claims
    try {
      const payload = parseJWTPayload(data.access_token)
      if (payload?.tier || payload?.permissions) {
        const membershipStore = useMembershipStore()
        membershipStore.updatePermissionsFromJwt(payload)
      }
    } catch (parseError) {
      console.warn('[Auth] 解析JWT权限Claims失败:', parseError)
    }

    // 预热已废弃（YuzhenFork MCP 自动连接）
    // if (!options?.skipWarmup && data.user.id) {
    //   warmupDamlRag(data.user.id)
    // }
  }

  /**
   * 登录
   */
  async function login(credentials: LoginCredentials) {
    try {
      loading.value = true
      const response = await loginApi(credentials)

      if (response.code === 200 && response.data) {
        await handleAuthSuccess(response.data)
        showSuccess(response.msg || '登录成功')
        return { success: true, message: response.msg || '登录成功' }
      } else {
        showError(response.msg || '登录失败')
        return { success: false, message: response.msg || '登录失败' }
      }
    } catch (error: any) {
      const msg = error.message || '登录失败，请稍后重试'
      console.error('[Auth] 登录异常:', msg, error)
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  /**
   * 注册
   */
  async function register(data: RegisterData) {
    try {
      loading.value = true
      const response = await registerApi(data)

      if (response.code === 200 && response.data) {
        await handleAuthSuccess(response.data, { skipWarmup: true })
        showSuccess(response.msg || '注册成功')
        return { success: true, message: response.msg || '注册成功' }
      } else {
        showError(response.msg || '注册失败')
        return { success: false, message: response.msg || '注册失败' }
      }
    } catch (error: any) {
      const msg = error.message || '注册失败，请稍后重试'
      console.error('[Auth] 注册异常:', msg, error)
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  /**
   * 手机号注册（REQ-C2: 统一走 authStore）
   */
  async function registerByPhone(data: { nickname: string; phone: string; phone_code: string; password: string; password_confirmation: string }) {
    try {
      loading.value = true
      const response = await registerByPhoneApi(data)

      if (response.code === 200 && response.data) {
        await handleAuthSuccess(response.data, { skipWarmup: true })
        showSuccess(response.msg || '注册成功')
        return { success: true, message: response.msg || '注册成功' }
      } else {
        showError(response.msg || '注册失败')
        return { success: false, message: response.msg || '注册失败' }
      }
    } catch (error: any) {
      const msg = error.message || '注册失败，请稍后重试'
      console.error('[Auth] 手机号注册异常:', msg, error)
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  /**
   * 手机号验证码登录（REQ-C2: 统一走 authStore）
   */
  async function loginByPhone(phone: string, code: string) {
    try {
      loading.value = true
      const response = await smsLoginApi(phone, code)

      if (response.code === 200 && response.data) {
        await handleAuthSuccess(response.data)
        showSuccess('登录成功')
        return { success: true, message: '登录成功' }
      } else {
        showError(response.msg || '登录失败')
        return { success: false, message: response.msg || '登录失败' }
      }
    } catch (error: any) {
      const msg = error.message || '登录失败，请稍后重试'
      console.error('[Auth] 手机号登录异常:', msg, error)
      return { success: false, message: msg }
    } finally {
      loading.value = false
    }
  }

  /**
   * 登出
   */
  async function logout() {
    try {
      loading.value = true
      await logoutApi()
      
      // ✅ 显示成功Toast
      showSuccess('已退出登录')
    } catch (error) {
      console.error('Logout error:', error)
      // 登出失败也显示Toast
      showError('登出失败，请重试')
    } finally {
      // 停止TokenManager自动刷新
      const tokenManager = getTokenManager()
      tokenManager.stopAutoRefresh()
      tokenManager.clearTokens()
      
      // 清除本地状态
      user.value = null
      isAuthenticated.value = false
      clearToken()
      
      // 清除关联stores
      const userStore = useUserStore()
      const membershipStore = useMembershipStore()
      const topicStore = useTopicStore()
      const { useUsageStore } = await import('@/stores/usage')
      const usageStore = useUsageStore()
      
      userStore.resetProfile()
      membershipStore.clearMembership()
      topicStore.clearTopics()
      usageStore.clearUsage()
      
      loading.value = false
    }
  }

  return {
    // State
    user,
    isAuthenticated,
    loading,
    
    // Getters
    userName,
    userEmail,
    userAvatar,
    isAdmin,
    
    // Actions
    init,
    login,
    loginByPhone,
    register,
    registerByPhone,
    logout,
  }
})
