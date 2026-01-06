/**
 * Exercise API
 * 动作库 API 调用层
 * 复刻自 yuzhen_fitness_v2
 *
 * 连接到 Laravel 后端: http://localhost:8000/api
 * 使用 exercises-v2 API (FixedExercisesV2Controller)
 * 数据来源: storage/app/public/exercises_v2/ (1603+ 动作)
 */

import axios from 'axios'
import { getToken } from '@/utils/token'
import type {
  ExerciseBasic,
  ExerciseDetail,
  FilterOptions,
  FilterConditions,
  PaginationInfo,
} from '@/types/exercise'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// 创建 axios 实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
  (error) => Promise.reject(error)
)

/**
 * 动作库 API
 */
export const exerciseApi = {
  /**
   * 获取动作列表
   */
  getList: async (params?: {
    page?: number
    pageSize?: number
    search?: string
    muscle?: string
    filters?: FilterConditions
  }): Promise<{
    code: number
    msg: string
    data: { items: ExerciseBasic[]; pagination: PaginationInfo } | null
  }> => {
    try {
      const response = await api.get('/exercises-v2', {
        params: {
          page: params?.page || 1,
          per_page: params?.pageSize || 20,
          query: params?.search,
          muscle: params?.muscle,
          equipment: params?.filters?.equipment?.length ? params.filters.equipment.join(',') : undefined,
          difficulty: params?.filters?.difficulty?.length ? params.filters.difficulty.join(',') : undefined,
          grip: params?.filters?.grip?.length ? params.filters.grip[0] : undefined,
          mechanic: params?.filters?.mechanic?.length ? params.filters.mechanic[0] : undefined,
          force: params?.filters?.force?.length ? params.filters.force[0] : undefined,
        },
      })

      if (response.data.code === 200 && response.data.data) {
        const data = response.data.data
        return {
          code: 200,
          msg: response.data.msg || '成功',
          data: {
            items: data.rows || data.exercises || [],
            pagination: {
              current: data.page || data.pagination?.current_page || 1,
              pageSize: data.per_page || data.pagination?.per_page || 20,
              total: data.total || data.pagination?.total || 0,
              totalPages: data.total_pages || data.pagination?.last_page || 0,
            },
          },
        }
      }
      return { code: response.data.code || 500, msg: response.data.msg || '获取失败', data: null }
    } catch (error: any) {
      console.error('获取动作列表失败:', error)
      return { code: 500, msg: error.message || '网络错误', data: null }
    }
  },

  /**
   * 获取动作详情
   */
  getDetail: async (id: number): Promise<{
    code: number
    msg: string
    data: ExerciseDetail | null
  }> => {
    try {
      const response = await api.get(`/exercises-v2/${id}`)
      if (response.data.code === 200 && response.data.data) {
        return { code: 200, msg: response.data.msg || '成功', data: response.data.data }
      }
      return { code: response.data.code || 500, msg: response.data.msg || '获取失败', data: null }
    } catch (error: any) {
      console.error('获取动作详情失败:', error)
      return { code: 500, msg: error.message || '网络错误', data: null }
    }
  },

  /**
   * 获取筛选选项
   */
  getFilterOptions: async (): Promise<{
    code: number
    msg: string
    data: FilterOptions | null
  }> => {
    try {
      const response = await api.get('/exercises-v2/filter-options', { timeout: 30000 })
      if (response.data.code === 200 && response.data.data) {
        const apiData = response.data.data
        // ✅ 后端已修复为返回单数键名，直接使用
        return {
          code: 200,
          msg: response.data.msg || '成功',
          data: {
            muscle: apiData.muscle || [],
            equipment: apiData.equipment || [],
            difficulty: apiData.difficulty || [],
            grip: apiData.grip || [],
            mechanic: apiData.mechanic || [],
            force: apiData.force || [],
            kinetic_chain: apiData.kinetic_chain || [],
            safety_level: apiData.safety_level || [],
          },
        }
      }
      return { code: response.data.code || 500, msg: response.data.msg || '获取失败', data: null }
    } catch (error: any) {
      console.error('获取筛选选项失败:', error)
      return { code: 500, msg: error.message || '网络错误', data: null }
    }
  },
}
