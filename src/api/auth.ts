import axios from 'axios'
import { getToken, getRefreshToken } from '@/utils/token'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

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

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('[API Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    if (error.response) {
      // 服务器返回错误
      const status = error.response.status
      const message = error.response.data?.message || error.response.data?.msg || '请求失败'
      
      // 特殊状态码处理
      if (status === 413) {
        return Promise.reject(new Error('文件太大，请选择小于5MB的图片'))
      } else if (status === 422) {
        return Promise.reject(new Error(message))
      } else if (status === 500) {
        return Promise.reject(new Error('服务器错误，请稍后重试'))
      }
      
      return Promise.reject(new Error(message))
    } else if (error.request) {
      // 请求发出但没有响应
      console.error('[Network Error] 请求超时或无响应', error.request)
      return Promise.reject(new Error('网络连接失败，请检查网络或稍后重试'))
    } else {
      // 其他错误
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

export default api
