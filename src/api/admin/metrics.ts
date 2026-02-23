/**
 * 管理员仪表盘聚合 API
 *
 * 对应后端 AdminMetricsController，所有数据来自 MySQL chat_sessions 表，
 * 后端有 Redis 缓存（TTL 10分钟）。
 */

import api from '@/api/auth'

// ========== 类型定义 ==========

export interface SystemOverviewStats {
  total_requests: number
  avg_ttfb_ms: number | null
  avg_duration_ms: number | null
  success_rate: number | null
  active_users: number
  total_credits: number
  total_tokens: number
}

export interface TrendPoint {
  date: string
  requests: number
  avg_ttfb_ms: number | null
  avg_duration_ms: number | null
  success_rate: number | null
  active_users: number
}

export interface SystemOverviewData {
  stats: SystemOverviewStats
  trend: TrendPoint[]
}

export interface ModelComparisonItem {
  backend_used: string
  total_calls: number
  avg_ttfb_ms: number | null
  avg_duration_ms: number | null
  total_input_tokens: number
  total_output_tokens: number
  total_credits: number
  avg_tokens_per_sec: number | null
  success_rate: number | null
  avg_fallback_count: number | null
}

export interface ModeComparisonItem {
  execution_mode: 'dag' | 'agent'
  total_calls: number
  avg_ttfb_ms: number | null
  avg_duration_ms: number | null
  avg_tokens_per_sec: number | null
  total_credits: number
  avg_quality_score: number | null
  success_rate: number | null
}

export interface ToolItem {
  name: string
  count: number
}

export interface ComboItem {
  combo: string
  count: number
}

export interface ToolUsageData {
  tools: ToolItem[]
  combos: ComboItem[]
  total_sessions: number
}

export interface TopUser {
  id: number
  name: string
  membership_tier: string
  total_queries: number
  total_credits: number
  total_tokens: number
  avg_quality: number | null
}

export interface ConsumptionTrend {
  date: string
  total_credits: number
  active_users: number
  total_queries: number
}

export interface UserConsumptionData {
  top_users: TopUser[]
  trend: ConsumptionTrend[]
}

export interface QualityTrendPoint {
  date: string
  avg_overall_score: number | null
  avg_ux_score: number | null
  avg_personalization_pct: number | null
  fewshot_count: number
  total_sessions: number
}

export interface GradeDistribution {
  personalization_grade: string
  count: number
}

export interface QualityTrendData {
  trend: QualityTrendPoint[]
  grade_distribution: GradeDistribution[]
}

// ========== API 调用 ==========

const BASE = '/admin/metrics/dashboard'

export function getSystemOverview(days = 7) {
  return api.get<SystemOverviewData>(`${BASE}/system-overview`, { params: { days } })
}

export function getModelComparison(days = 7) {
  return api.get<ModelComparisonItem[]>(`${BASE}/model-comparison`, { params: { days } })
}

export function getModeComparison(days = 7) {
  return api.get<ModeComparisonItem[]>(`${BASE}/mode-comparison`, { params: { days } })
}

export function getToolUsage(days = 7) {
  return api.get<ToolUsageData>(`${BASE}/tool-usage`, { params: { days } })
}

export function getUserConsumption(days = 7) {
  return api.get<UserConsumptionData>(`${BASE}/user-consumption`, { params: { days } })
}

export function getQualityTrend(days = 7) {
  return api.get<QualityTrendData>(`${BASE}/quality-trend`, { params: { days } })
}
