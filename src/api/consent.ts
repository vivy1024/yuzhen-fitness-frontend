/**
 * 协议同意记录 API
 *
 * 后端API: /api/consent
 * 认证: JWT Token (jwt.auth middleware)
 */

import api from './auth'

interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

interface ConsentRecordResponse {
  id: number
  consented_at: string
}

/**
 * 记录用户同意协议
 * POST /api/consent/record
 */
export const recordConsent = (
  consentType: 'terms' | 'privacy',
  consentVersion: string
): Promise<ApiResponse<ConsentRecordResponse>> => {
  return api.post('/consent/record', {
    consent_type: consentType,
    consent_version: consentVersion,
  })
}

/**
 * 获取用户最新同意记录
 * GET /api/consent/latest
 */
export const getLatestConsent = (): Promise<ApiResponse<Record<string, any>>> => {
  return api.get('/consent/latest')
}
