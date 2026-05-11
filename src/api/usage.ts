/**
 * 用量管理API（已废弃）
 * 
 * @deprecated 此API模块已被credit.ts替代
 * 积分体系改造后，使用credit.ts中的API
 * 保留此文件仅供参考，请勿在新代码中使用
 * 
 * @see credit.ts
 * @author 薛小川
 * @created 2026-01-11
 * @deprecated 2026-02-05
 */

// 保留类型导出以避免旧引用报错（均已废弃）

/** @deprecated */
export interface TodayUsage {
  date: string
  [key: string]: any
}

/** @deprecated */
export interface UserCredits {
  total_credits: number
  [key: string]: any
}

/** @deprecated */
export interface UsageCheckResult {
  allowed: boolean
  remaining: number
  use_credits: boolean
  message: string
}

/** @deprecated */
export interface UsageIncrementResult {
  success: boolean
  used_credits: boolean
  new_count: number
  remaining: number
  message: string
}

/** @deprecated */
export interface UsageHistory {
  period_days: number
  daily_stats: Array<{ date: string }>
  [key: string]: any
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// 所有 API 函数已废弃，返回空数据避免运行时报错

/** @deprecated */
export const getTodayUsage = (): Promise<ApiResponse<null>> => {
  return Promise.resolve({ code: 200, msg: 'deprecated', data: null })
}

/** @deprecated */
export const getCredits = (): Promise<ApiResponse<null>> => {
  return Promise.resolve({ code: 200, msg: 'deprecated', data: null })
}

/** @deprecated */
export const checkUsage = (_mode: string): Promise<ApiResponse<UsageCheckResult>> => {
  return Promise.resolve({
    code: 200,
    msg: 'deprecated',
    data: { allowed: true, remaining: 0, use_credits: false, message: 'deprecated' }
  })
}

/** @deprecated */
export const incrementUsage = (_mode: string): Promise<ApiResponse<UsageIncrementResult>> => {
  return Promise.resolve({
    code: 200,
    msg: 'deprecated',
    data: { success: false, used_credits: false, new_count: 0, remaining: 0, message: 'deprecated' }
  })
}

/** @deprecated */
export const getUsageHistory = (_days?: number): Promise<ApiResponse<null>> => {
  return Promise.resolve({ code: 200, msg: 'deprecated', data: null })
}

export default {
  getTodayUsage,
  getCredits,
  checkUsage,
  incrementUsage,
  getUsageHistory,
}
