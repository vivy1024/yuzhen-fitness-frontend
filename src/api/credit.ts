/**
 * 积分系统API
 * 提供用户积分余额查询、流水历史、消耗统计等接口
 * 
 * @version v1.0.0
 * @date 2026-02-05
 * @author 薛小川
 * @requirements 4.1, 3.4, 3.5
 */

import api from './auth'

/**
 * 积分余额数据
 */
export interface CreditBalance {
  daily_quota: number
  daily_consumed: number
  remaining: number
  total_consumed: number
  membership_tier: 'free' | 'warmheart' | 'energy'
  is_mvp_phase: boolean
  low_balance_warning: boolean
  last_reset_date: string
}

/**
 * 积分流水记录
 */
export interface CreditTransaction {
  id: number
  credits: number
  tokens: number
  mode: 'dag' | 'agent'
  template_name: string | null
  conversation_id: string | null
  input_tokens: number
  output_tokens: number
  description: string | null
  created_at: string
}

/**
 * 积分统计数据
 */
export interface CreditStats {
  period_days: number
  total_credits: number
  total_tokens: number
  dag_credits: number
  agent_credits: number
  avg_credits_per_day: number
  daily_stats: Array<{
    date: string
    credits: number
    tokens: number
  }>
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  last_page: number
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/**
 * 获取积分余额
 * GET /api/credits/balance
 * 
 * @requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */
export const getBalance = (): Promise<ApiResponse<CreditBalance>> => {
  return api.get('/credits/balance')
}

/**
 * 获取积分流水历史
 * GET /api/credits/history
 * 
 * @param page 页码
 * @param perPage 每页数量
 * @param mode 筛选模式（可选）
 * @requirements 3.4
 */
export const getHistory = (
  page: number = 1,
  perPage: number = 20,
  mode?: 'dag' | 'agent'
): Promise<ApiResponse<PaginatedResponse<CreditTransaction>>> => {
  const params: Record<string, any> = { page, per_page: perPage }
  if (mode) params.mode = mode
  return api.get('/credits/history', { params })
}

/**
 * 获取积分消耗统计
 * GET /api/credits/stats
 * 
 * @param days 统计天数（默认30天）
 * @requirements 3.5
 */
export const getStats = (days: number = 30): Promise<ApiResponse<CreditStats>> => {
  return api.get('/credits/stats', { params: { days } })
}

export default {
  getBalance,
  getHistory,
  getStats,
}
