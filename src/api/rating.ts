/**
 * 评分API
 * 提供AI回复评分接口
 * 
 * 后端API: /api/v2/quality/rating
 * 认证: JWT Token (jwt.auth middleware)
 * 
 * @author 玉珍健身 v3.0
 * @spec yuzhen-fitness-feature-migration - TASK-5.3
 * @updated 2025-01-02 - 对接后端三轨评分系统API
 */

import api from './auth'

/**
 * 评分数据接口
 */
export interface Rating {
  messageId: string
  
  // 用户体验评分 (1-5)
  userExperience: {
    clarity: number // 易懂性
    usefulness: number // 实用性
    detail: number // 详细程度
    friendliness: number // 友好度
    overall: number // 整体满意度
  }
  
  // 个性化感知评分 (自动计算, 0-100%)
  personalization?: {
    profileUtilization: number // 档案利用率
    goalAlignment: number // 目标对齐度
    uniqueness: number // 独特性
    dynamicAdjustment: number // 动态调整
  }
  
  // 文本反馈
  feedback?: string
  
  timestamp: number
}

/**
 * 提交评分数据（后端格式）
 */
export interface SubmitRatingData {
  session_id: string
  user_experience: {
    clarity: number
    practicality: number // 后端使用practicality而非usefulness
    detail: number
    friendliness: number
    satisfaction: number // 后端使用satisfaction而非overall
  }
  feedback_text?: string
}

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/**
 * 后端响应数据
 */
export interface RatingResponse {
  session_id: string
  user_experience: {
    clarity: number
    practicality: number
    detail: number
    friendliness: number
    satisfaction: number
  }
  personalization: {
    profile_utilization_rate: number
    goal_alignment: number
    uniqueness: number
    dynamic_adjustment: number
  }
  personalization_grade: string
  overall_score: number
  fewshot_eligible: boolean
}

/**
 * 提交评分
 * POST /api/v2/quality/rating
 * 
 * @param rating 评分数据
 * @returns API响应
 */
export const submitRating = (rating: Rating): Promise<ApiResponse<RatingResponse>> => {
  // 转换为后端期望的格式（snake_case）
  const data: SubmitRatingData = {
    session_id: rating.messageId, // messageId实际上是session_id
    user_experience: {
      clarity: rating.userExperience.clarity,
      practicality: rating.userExperience.usefulness, // usefulness → practicality
      detail: rating.userExperience.detail,
      friendliness: rating.userExperience.friendliness,
      satisfaction: rating.userExperience.overall // overall → satisfaction
    },
    feedback_text: rating.feedback
  }
  
  return api.post('/v2/quality/rating', data)
}

/**
 * 获取消息的评分（可选，用于查看历史评分）
 * GET /api/v2/quality/rating/:sessionId
 * 
 * @param sessionId 会话ID
 * @returns 评分数据
 */
export const getRating = (sessionId: string): Promise<ApiResponse<RatingResponse>> => {
  return api.get(`/v2/quality/rating/${sessionId}`)
}

/**
 * 检查会话Few-Shot资格
 * GET /api/v2/quality/rating/:sessionId/eligibility
 * 
 * @param sessionId 会话ID
 * @returns 资格检查结果
 */
export const checkEligibility = (sessionId: string): Promise<ApiResponse<any>> => {
  return api.get(`/v2/quality/rating/${sessionId}/eligibility`)
}
