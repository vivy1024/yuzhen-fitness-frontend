/**
 * 积分系统 v2 API
 * 提供积分余额、流水、签到等接口
 */

import api from './auth'

export interface CreditBalance {
  balance: string
  bonus_balance: string
  total_available: string
  monthly_limit: string
  used_this_month: string
  monthly_remaining: string
  tier: 'free' | 'warmheart' | 'energy'
}

export interface CreditTransaction {
  id: number
  type: 'earn' | 'spend' | 'reset' | 'bonus' | 'admin_adjust'
  amount: string
  balance_after: string
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  source: string | null
  description: string | null
  created_at: string
}

export interface TransactionsResponse {
  data: CreditTransaction[]
  current_page: number
  last_page: number
}

/**
 * 获取积分余额
 * GET /api/credits/v2/balance
 */
export const getBalance = () => {
  return api.get<CreditBalance>('/credits/v2/balance')
}

/**
 * 获取积分流水（分页）
 * GET /api/credits/v2/transactions
 */
export const getTransactions = (page = 1) => {
  return api.get<TransactionsResponse>('/credits/v2/transactions', { params: { page } })
}

/**
 * 每日签到
 * POST /api/credits/v2/checkin
 */
export const checkin = () => {
  return api.post('/credits/v2/checkin')
}
