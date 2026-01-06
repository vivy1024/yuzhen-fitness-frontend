import api from '@/api/auth'
import type { Feedback, SubmitFeedbackParams } from '@/stores/feedback'

/**
 * 提交反馈
 */
export const submitFeedback = async (params: SubmitFeedbackParams): Promise<Feedback> => {
  const response = await api.post<{ data: Feedback }>('/feedback', params)
  return (response as any).data
}

/**
 * 获取历史反馈
 */
export const getFeedbackHistory = async (): Promise<Feedback[]> => {
  const response = await api.get<{ data: Feedback[] }>('/feedback')
  return (response as any).data
}

/**
 * 上传截图
 */
export const uploadScreenshot = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post<{ data: { url: string } }>('/feedback/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  
  return (response as any).data.url
}

/**
 * 清空localStorage中的反馈数据（用于测试）
 */
export const clearFeedbackStorage = (): void => {
  localStorage.removeItem('yuzhen_feedbacks')
}
