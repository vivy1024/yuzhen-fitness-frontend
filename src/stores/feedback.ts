import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as feedbackApi from '@/api/feedback'

/**
 * 反馈类型
 */
export type FeedbackType = 'feature' | 'bug' | 'question' | 'other'

/**
 * 反馈状态
 */
export type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'closed'

/**
 * 反馈数据模型
 */
export interface Feedback {
  id: number
  user_id: number
  type: FeedbackType
  content: string
  images?: string[]
  contact?: string
  status: FeedbackStatus
  reply?: string
  reply_at?: string
  created_at: string
  updated_at: string
}

/**
 * 提交反馈参数
 */
export interface SubmitFeedbackParams {
  type: FeedbackType
  content: string
  images?: string[]
  contact?: string
}

/**
 * 反馈Store
 */
export const useFeedbackStore = defineStore('feedback', () => {
  // 状态
  const history = ref<Feedback[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 提交反馈
   */
  const submitFeedback = async (params: SubmitFeedbackParams): Promise<Feedback> => {
    isLoading.value = true
    error.value = null

    try {
      const feedback = await feedbackApi.submitFeedback(params)
      
      // 添加到历史记录开头
      history.value.unshift(feedback)
      
      return feedback
    } catch (err: any) {
      error.value = err.message || '提交反馈失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取历史反馈
   */
  const fetchHistory = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const data = await feedbackApi.getFeedbackHistory()
      history.value = data
    } catch (err: any) {
      error.value = err.message || '获取历史反馈失败'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 获取单个反馈详情
   */
  const getFeedbackById = (id: number): Feedback | undefined => {
    return history.value.find(item => item.id === id)
  }

  /**
   * 清空错误
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 重置状态
   */
  const reset = () => {
    history.value = []
    isLoading.value = false
    error.value = null
  }

  return {
    // 状态
    history,
    isLoading,
    error,

    // 方法
    submitFeedback,
    fetchHistory,
    getFeedbackById,
    clearError,
    reset
  }
})
