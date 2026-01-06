/**
 * 会员管理API
 * 提供会员等级、权限检查、支付、账单历史等接口
 */

import api from './auth'

export interface MembershipTier {
  id: number
  name: string
  slug: string
  price: number
  original_price?: number
  duration_days: number
  features: string[]
  limits: {
    daily_ai_queries: number
    max_training_plans: number
    advanced_features: boolean
  }
  is_active: boolean
  popular?: boolean
  discount_percent?: number
}

export interface UserMembership {
  id: number
  user_id: number
  membership_id: number
  membership_type: string
  is_active: boolean
  started_at: string
  expires_at: string
  remaining_days: number
  auto_renew: boolean
  membership?: MembershipTier
}

export interface PaymentOrder {
  id: string
  order_no: string
  user_id: number
  membership_tier_id: number
  amount: number
  payment_method: 'wechat' | 'alipay'
  status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'
  qr_code_url?: string
  pay_url?: string
  created_at: string
  paid_at?: string
  expires_at: string
}

export interface BillingRecord {
  id: number
  order_no: string
  membership_name: string
  amount: number
  payment_method: 'wechat' | 'alipay'
  status: 'paid' | 'refunded'
  created_at: string
  paid_at: string
  duration_days: number
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/**
 * 获取所有会员等级
 * GET /api/membership/tiers
 */
export const getMembershipTiers = (): Promise<ApiResponse<MembershipTier[]>> => {
  return api.get('/membership/tiers')
}

/**
 * 获取当前用户会员信息
 * GET /api/membership/current
 */
export const getCurrentMembership = (): Promise<ApiResponse<UserMembership | null>> => {
  return api.get('/membership/current')
}

/**
 * 检查用户权限
 * POST /api/membership/check-permission
 */
export const checkPermission = (permission: string): Promise<ApiResponse<{
  allowed: boolean
  reason?: string
  upgrade_required?: boolean
}>> => {
  return api.post('/membership/check-permission', { permission })
}

/**
 * 创建支付订单
 * POST /api/membership/orders
 */
export const createPaymentOrder = (data: {
  tier_id: number
  payment_method: 'wechat' | 'alipay'
}): Promise<ApiResponse<PaymentOrder>> => {
  // 后端期望 membership_id，前端使用 tier_id
  return api.post('/membership/orders', {
    membership_id: data.tier_id,
    payment_method: data.payment_method
  })
}

/**
 * 查询支付订单状态
 * GET /api/membership/orders/:order_no
 */
export const getPaymentStatus = (orderNo: string): Promise<ApiResponse<PaymentOrder>> => {
  return api.get(`/membership/orders/${orderNo}`)
}

/**
 * 取消支付订单
 * POST /api/membership/orders/:order_id/cancel
 */
export const cancelPaymentOrder = (orderId: number): Promise<ApiResponse<null>> => {
  return api.post(`/membership/orders/${orderId}/cancel`)
}

/**
 * 删除订单（仅待支付订单）
 * DELETE /api/membership/orders/:order_id
 */
export const deleteOrder = (orderId: number): Promise<ApiResponse<null>> => {
  return api.delete(`/membership/orders/${orderId}`)
}

/**
 * 获取支付历史（订单列表）
 * GET /api/membership/orders
 */
export const getPaymentHistory = (params?: {
  page?: number
  per_page?: number
}): Promise<ApiResponse<{
  records: BillingRecord[]
  total: number
  page: number
  per_page: number
}>> => {
  return api.get('/membership/orders', { params })
}

/**
 * 取消自动续费
 * POST /api/membership/cancel-auto-renew
 */
export const cancelAutoRenew = (): Promise<ApiResponse<null>> => {
  return api.post('/membership/cancel-auto-renew')
}

/**
 * 开启自动续费
 * POST /api/membership/enable-auto-renew
 */
export const enableAutoRenew = (): Promise<ApiResponse<null>> => {
  return api.post('/membership/enable-auto-renew')
}

/**
 * 获取收款码
 * GET /api/membership/payment-qrcodes
 */
export const getPaymentQRCodes = (): Promise<ApiResponse<{
  wechat: string
  alipay: string
}>> => {
  return api.get('/membership/payment-qrcodes')
}

/**
 * 上传支付截图
 * POST /api/membership/orders/:orderNo/upload-proof
 */
export const uploadPaymentProof = (
  orderNo: string,
  file: File,
  payMethod: 'wechat' | 'alipay'
): Promise<ApiResponse<{
  order_no: string
  status: string
  payment_proof_url: string
  message: string
}>> => {
  const formData = new FormData()
  formData.append('payment_proof', file)
  formData.append('pay_method', payMethod)
  
  return api.post(`/membership/orders/${orderNo}/upload-proof`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export default {
  getMembershipTiers,
  getCurrentMembership,
  checkPermission,
  createPaymentOrder,
  getPaymentStatus,
  cancelPaymentOrder,
  getPaymentHistory,
  cancelAutoRenew,
  enableAutoRenew,
  getPaymentQRCodes,
  uploadPaymentProof,
}
