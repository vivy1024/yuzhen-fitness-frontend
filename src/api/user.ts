/**
 * User Profile API
 * 用户档案 API 调用层
 */

import type { UserProfile, FFMIAssessment } from '@/types/user-profile'
import { getToken } from '@/utils/token'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export interface ApiResponse<T> {
  code: number
  msg: string
  data: T | null
}

export interface FFMIHistory {
  id: number
  user_id: number
  height: number
  weight: number
  body_fat_percentage?: number
  ffmi_data: FFMIAssessment
  recorded_at: string
}

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    })

    const data = await response.json()
    
    if (response.ok && data.code === 200) {
      return { code: 200, msg: data.msg || '成功', data: data.data }
    }
    
    return { code: data.code || response.status, msg: data.msg || '请求失败', data: null }
  } catch (error: any) {
    console.error('API请求失败:', error)
    return { code: 500, msg: error.message || '网络错误', data: null }
  }
}

export const userProfileApi = {
  /**
   * 获取当前用户档案
   */
  async get(): Promise<ApiResponse<UserProfile>> {
    return request<UserProfile>('/users/profile')
  },

  /**
   * 更新用户档案
   */
  async update(profile: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    const result = await request<UserProfile>('/users/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    })

    // 同步到LocalStorage
    if (result.code === 200 && result.data) {
      localStorage.setItem('user_profile_v2', JSON.stringify(result.data))
      if (result.data.user_id) {
        localStorage.setItem('current_user_id', result.data.user_id.toString())
      }
    }

    return result
  },

  /**
   * 上传头像
   */
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatar_url: string }>> {
    const token = getToken()
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await fetch(`${API_BASE_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      const data = await response.json()
      
      if (response.ok && data.code === 200) {
        return { code: 200, msg: data.msg || '上传成功', data: data.data }
      }
      
      return { code: data.code || response.status, msg: data.msg || '上传失败', data: null }
    } catch (error: any) {
      return { code: 500, msg: error.message || '上传失败', data: null }
    }
  },

  /**
   * 获取FFMI历史记录
   */
  async getFFMIHistory(limit = 10): Promise<ApiResponse<FFMIHistory[]>> {
    return request<FFMIHistory[]>(`/users/profile/ffmi-history?limit=${limit}`)
  },
}

export default userProfileApi
