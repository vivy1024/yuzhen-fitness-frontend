import api from '@/api/auth'
import type { Feedback } from '@/stores/feedback'

/**
 * 回复反馈参数
 */
export interface ReplyFeedbackParams {
  status: string
  reply: string
}

/**
 * 获取所有反馈（管理员）
 */
export const getAllFeedbacks = async (): Promise<Feedback[]> => {
  const response = await api.get<{ data: Feedback[] }>('/admin/feedback')
  return (response as any).data
}

/**
 * 获取反馈统计（管理员）
 */
export const getFeedbackStats = async (): Promise<any> => {
  const response = await api.get<{ data: any }>('/admin/feedback/stats')
  return (response as any).data
}

/**
 * 回复反馈（管理员）
 */
export const replyToFeedback = async (
  feedbackId: number, 
  params: ReplyFeedbackParams
): Promise<Feedback> => {
  const response = await api.put<{ data: Feedback }>(
    `/admin/feedback/${feedbackId}/reply`,
    params
  )
  return (response as any).data
}

/**
 * 更新反馈状态（管理员）
 */
export const updateFeedbackStatus = async (
  feedbackId: number,
  status: string
): Promise<Feedback> => {
  const response = await api.put<{ data: Feedback }>(
    `/admin/feedback/${feedbackId}/status`,
    { status }
  )
  return (response as any).data
}

/**
 * 批量更新反馈状态（管理员）
 */
export const batchUpdateStatus = async (
  feedbackIds: number[],
  status: string
): Promise<void> => {
  await api.put('/admin/feedback/batch-status', {
    feedback_ids: feedbackIds,
    status
  })
}

/**
 * 删除反馈（管理员）
 */
export const deleteFeedback = async (feedbackId: number): Promise<void> => {
  await api.delete(`/admin/feedback/${feedbackId}`)
}
