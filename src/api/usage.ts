/**
 * 用量管理API
 * 提供用户AI查询用量的查询、检查和增加接口
 * 
 * @version v1.0.0
 * @date 2026-01-11
 * @author 薛小川
 * @requirements 4.1-4.6, 6.1-6.6
 */

import api from './auth'

/**
 * 今日用量统计数据
 */
export interface TodayUsage {
  dag_used: number
  dag_limit: number
  dag_remaining: number
  agent_used: number
  agent_limit: number
  agent_remaining: number
  dag_credits: number
  agent_credits: number
  date: string
  has_warning: boolean
  warnings: string[]
}

/**
 * 额外额度数据
 */
export interface UserCredits {
  dag_credits: number
  agent_credits: number
  total_credits: number
}

/**
 * 用量检查结果
 */
export interface UsageCheckResult {
  allowed: boolean
  remaining: number
  use_credits: boolean
  message: string
}

/**
 * 用量增加结果
 */
export interface UsageIncrementResult {
  success: boolean
  used_credits: boolean
  new_count: number
  remaining: number
  message: string
}

/**
 * 用量历史统计
 */
export interface UsageHistory {
  period_days: number
  total_dag_queries: number
  total_agent_queries: number
  avg_dag_per_day: number
  avg_agent_per_day: number
  daily_stats: Array<{
    date: string
    dag_queries: number
    agent_queries: number
  }>
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/**
 * 获取今日用量统计
 * GET /api/usage/today
 * 
 * @requirements 4.1, 4.3
 */
export const getTodayUsage = (): Promise<ApiResponse<TodayUsage>> => {
  return api.get('/usage/today')
}

/**
 * 获取额外额度余额
 * GET /api/usage/credits
 * 
 * @requirements 4.2
 */
export const getCredits = (): Promise<ApiResponse<UserCredits>> => {
  return api.get('/usage/credits')
}

/**
 * 检查是否可以执行查询
 * POST /api/usage/check
 * 
 * @param mode 查询模式：'dag' | 'agent'
 * @requirements 4.3
 */
export const checkUsage = (mode: 'dag' | 'agent'): Promise<ApiResponse<UsageCheckResult>> => {
  return api.post('/usage/check', { mode })
}

/**
 * 增加用量计数
 * POST /api/usage/increment
 * 
 * 此接口通常由DAML-RAG服务在查询完成后调用
 * 前端也可在需要时调用
 * 
 * @param mode 查询模式：'dag' | 'agent'
 * @requirements 4.6
 */
export const incrementUsage = (mode: 'dag' | 'agent'): Promise<ApiResponse<UsageIncrementResult>> => {
  return api.post('/usage/increment', { mode })
}

/**
 * 获取用量历史统计
 * GET /api/usage/history
 * 
 * @param days 统计天数（默认30天）
 */
export const getUsageHistory = (days: number = 30): Promise<ApiResponse<UsageHistory>> => {
  return api.get('/usage/history', { params: { days } })
}

export default {
  getTodayUsage,
  getCredits,
  checkUsage,
  incrementUsage,
  getUsageHistory,
}
