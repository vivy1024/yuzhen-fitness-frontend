/**
 * 用户预热API
 * 用于登录后预热用户档案和会员数据到DAML-RAG缓存
 */

import axios from 'axios'

const DAML_RAG_API_URL = import.meta.env.VITE_DAML_RAG_API_URL || 'http://localhost:8001'

// 创建DAML-RAG专用axios实例
const damlRagApi = axios.create({
  baseURL: DAML_RAG_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface WarmupRequest {
  user_id: string
  force_refresh?: boolean  // 是否强制刷新缓存（用户档案更新时设为true）
}

export interface WarmupResponse {
  success: boolean
  message: string
  user_id: string
  preload_status: {
    user_profile: string
    membership: string
  }
}

export interface WarmupStatusResponse {
  user_id: string
  user_profile_cached: boolean
  membership_preloaded: boolean
  user_profile_access_count?: number
}

/**
 * 预热用户数据
 * 在登录成功后调用，预热用户档案和会员数据到DAML-RAG缓存
 * @param userId 用户ID
 * @param forceRefresh 是否强制刷新缓存（用户档案更新时设为true）
 */
export async function warmupUser(userId: string | number, forceRefresh: boolean = false): Promise<WarmupResponse> {
  const response = await damlRagApi.post<WarmupResponse>('/api/v1/user/warmup', {
    user_id: String(userId),
    force_refresh: forceRefresh
  })
  return response.data
}

/**
 * 获取用户预热状态
 */
export async function getWarmupStatus(userId: string | number): Promise<WarmupStatusResponse> {
  const response = await damlRagApi.get<WarmupStatusResponse>(`/api/v1/user/warmup/status/${userId}`)
  return response.data
}
