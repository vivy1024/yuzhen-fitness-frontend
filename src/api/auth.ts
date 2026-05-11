import axios from 'axios'
import type { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { getToken, getRefreshToken } from '@/utils/token'
import { clearToken } from '@/utils/token'
import { showError } from '@/components/ui/toast'
import { getTokenManager } from '@/utils/token-manager'

/** 后端统一响应格式（响应拦截器已解包 response.data） */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/** 覆盖 axios 实例类型，使 .get/.post 等返回 ApiResponse 而非 AxiosResponse */
export interface ApiInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>
  (config: AxiosRequestConfig): Promise<ApiResponse>
  defaults: typeof axios.defaults
  interceptors: typeof axios.interceptors
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// 错误Toast防抖：3秒内同一消息不重复显示
const recentApiErrors = new Map<string, number>()
const API_ERROR_DEBOUNCE_MS = 3000

function showApiError(message: string) {
  const now = Date.now()
  const lastShown = recentApiErrors.get(message)
  if (lastShown && now - lastShown < API_ERROR_DEBOUNCE_MS) return
  recentApiErrors.set(message, now)
  if (recentApiErrors.size > 20) {
    for (const [key, time] of recentApiErrors) {
      if (now - time > API_ERROR_DEBOUNCE_MS) recentApiErrors.delete(key)
    }
  }
  showError(message)
}

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// 请求拦截器 - 添加 Token
api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误（401时自动尝试刷新Token）
api.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    
    if (error.response) {
      // 服务器返回错误
      const status = error.response.status
      const data = error.response.data as any
      const message = data?.msg || data?.message || '请求失败'
      
      // 根据状态码统一处理
      switch (status) {
        case 401: {
          // 非关键服务端点的401不触发登出（如DAML-RAG warmup服务端认证失败）
          const isNonCriticalEndpoint = originalRequest?.url?.includes('/warmup')
          if (isNonCriticalEndpoint) {
            return Promise.reject(error)
          }

          // 如果是刷新Token请求本身失败，或已重试过，直接登出
          const isAuthEndpoint = originalRequest?.url?.includes('/auth/refresh') || originalRequest?.url?.includes('/auth/login')
          if (isAuthEndpoint || originalRequest?._retry) {
            showApiError(message || '登录已过期，请重新登录')
            clearToken()
            localStorage.removeItem('user_info')
            localStorage.removeItem('current_user_id')
            const currentPath = window.location.pathname
            if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
              setTimeout(() => { window.location.href = '/auth/login?expired=1' }, 1000)
            }
            return Promise.reject(new Error(message || '未授权，请先登录'))
          }

          // REQ-C4: 统一委托给 TokenManager 刷新（TokenManager 内部已有并发保护）
          try {
            const tokenManager = getTokenManager()
            const refreshed = await tokenManager.refreshToken()

            if (refreshed) {
              const newToken = tokenManager.getAccessToken()
              if (newToken && originalRequest) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                originalRequest._retry = true
                return api(originalRequest)
              }
            }
          } catch {
            // 刷新异常，走下面的登出逻辑
          }

          // 刷新失败，登出
          showApiError(message || '登录已过期，请重新登录')
          clearToken()
          localStorage.removeItem('user_info')
          localStorage.removeItem('current_user_id')
          const currentPath = window.location.pathname
          if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            setTimeout(() => { window.location.href = '/auth/login?expired=1' }, 1000)
          }
          return Promise.reject(new Error(message || '未授权，请先登录'))
        }
        
        case 403:
          // 权限不足
          showApiError(message || '权限不足，无法执行此操作')
          return Promise.reject(new Error(message || '权限不足'))
        
        case 404:
          // 资源不存在
          showApiError(message || '请求的资源不存在')
          return Promise.reject(new Error(message || '资源不存在'))
        
        case 413:
          // 文件太大
          showApiError('文件太大，请选择小于5MB的图片')
          return Promise.reject(new Error('文件太大'))
        
        case 422:
          // 验证错误 - 提取字段级错误
          const errors = data?.data?.errors || data?.errors
          if (errors && typeof errors === 'object') {
            // 显示第一个字段的错误
            const firstError = Object.values(errors)[0]
            const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError
            showApiError(errorMessage || message || '数据验证失败')
          } else {
            showApiError(message || '数据验证失败')
          }
          return Promise.reject(new Error(message || '数据验证失败'))
        
        case 429:
          // 限流
          showApiError(message || '请求过于频繁，请稍后再试')
          return Promise.reject(new Error(message || '请求过于频繁'))
        
        case 500:
        case 502:
        case 503:
        case 504:
          // 服务器错误
          showApiError(message || '服务器错误，请稍后重试')
          return Promise.reject(new Error(message || '服务器错误'))
        
        default:
          // 其他错误
          showApiError(message || '操作失败')
          return Promise.reject(new Error(message || '操作失败'))
      }
    } else if (error.request) {
      // 请求发出但没有响应（网络错误）
      console.error('[Network Error] 请求超时或无响应', error.request)
      showApiError('网络连接失败，请检查网络')
      return Promise.reject(new Error('网络连接失败，请检查网络'))
    } else {
      // 其他错误（请求配置错误等）
      showApiError('请求配置错误')
      return Promise.reject(new Error(error.message || '未知错误'))
    }
  }
)

export interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
}

export interface RegisterData {
  nickname: string
  email: string
  email_code?: string  // 邮箱验证码
  password: string
  password_confirmation: string
  phone?: string
  phone_code?: string  // 手机验证码
  gender?: 'male' | 'female'
  age?: number
}

export interface AuthResponse {
  code: number
  msg: string
  data: {
    user: {
      id: number
      name: string
      email: string
      phone?: string
      avatar?: string
    }
    access_token: string
    refresh_token?: string
    token_type: string
    expires_in: number
  }
}

/**
 * 邮箱密码登录
 * 后端使用identifier字段（可以是用户名/邮箱/手机号）
 */
export const login = (credentials: LoginCredentials): Promise<AuthResponse> => {
  return api.post('/auth/login', {
    identifier: credentials.email,
    password: credentials.password,
    remember_me: credentials.remember_me
  })
}

/**
 * 用户注册
 */
export const register = (data: RegisterData): Promise<AuthResponse> => {
  return api.post('/auth/register', data)
}

/**
 * 手机号注册
 */
export const registerByPhone = (data: {
  nickname: string
  phone: string
  phone_code: string
  password: string
  password_confirmation: string
}): Promise<AuthResponse> => {
  return api.post('/auth/register/phone', data)
}

/**
 * 刷新 Token
 * 使用refresh_token获取新的access_token
 */
export const refreshToken = (): Promise<AuthResponse> => {
  const refreshTokenValue = getRefreshToken()
  return api.post('/auth/refresh', {
    refresh_token: refreshTokenValue
  })
}

/**
 * 登出
 */
export const logout = (): Promise<any> => {
  return api.post('/auth/logout')
}

export default api as unknown as ApiInstance
