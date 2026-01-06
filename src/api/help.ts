/**
 * 帮助中心API接口
 */

import api from './auth'

export interface FAQ {
  id: string
  category: 'account' | 'training' | 'membership' | 'technical'
  question: string
  answer: string
  order: number
  helpful_count: number
  not_helpful_count: number
  created_at: string
  updated_at: string
}

export interface FAQListResponse {
  code: number
  msg: string
  data: FAQ[]
}

export interface FAQDetailResponse {
  code: number
  msg: string
  data: {
    faq: FAQ
    related?: FAQ[]
  }
}

export interface SuccessResponse {
  code: number
  msg: string
  data?: any
}

/**
 * 获取FAQ列表
 */
export const getFaqs = (): Promise<FAQListResponse> => {
  return api.get('/help/faqs')
}

/**
 * 获取FAQ详情
 */
export const getFaqDetail = (faqId: string): Promise<FAQDetailResponse> => {
  return api.get(`/help/faqs/${faqId}`)
}

/**
 * 提交FAQ反馈
 */
export const submitFaqFeedback = (
  faqId: string,
  helpful: boolean
): Promise<SuccessResponse> => {
  return api.post(`/help/faqs/${faqId}/feedback`, {
    helpful
  })
}
