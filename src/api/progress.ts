/**
 * 进度追踪API
 * 提供进度记录、目标管理等接口
 * 
 * @author BUILD_BODY Team
 * @version 1.0.0
 * @created 2026-01-05
 */

import api from './auth'

// ============ 类型定义 ============

/** 围度数据 */
export interface Measurements {
  chest?: number // 胸围 cm
  waist?: number // 腰围 cm
  hips?: number // 臀围 cm
  arms?: number // 臂围 cm
  thighs?: number // 大腿围 cm
}

/** 进度记录 */
export interface ProgressRecord {
  id: number
  userId: number
  date: string
  weight: number // kg
  bodyFat?: number // %
  ffmi?: number
  measurements?: Measurements
  photos?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

/** 创建进度记录请求 */
export interface CreateProgressRecordRequest {
  date: string
  weight: number
  body_fat?: number
  measurements?: {
    chest?: number
    waist?: number
    hips?: number
    arms?: number
    thighs?: number
  }
  notes?: string
}

/** 更新进度记录请求 */
export interface UpdateProgressRecordRequest {
  weight?: number
  body_fat?: number
  measurements?: {
    chest?: number
    waist?: number
    hips?: number
    arms?: number
    thighs?: number
  }
  notes?: string
}

/** 健身目标 */
export interface FitnessGoal {
  id: number
  userId: number
  type: 'weight' | 'body_fat' | 'muscle_mass' | 'strength' | 'custom'
  name: string
  targetValue: number
  currentValue: number
  startValue: number
  unit: string
  startDate: string
  targetDate?: string
  completedAt?: string
  status: 'active' | 'completed' | 'abandoned'
  progress: number // 0-100
  createdAt: string
  updatedAt: string
}

/** 创建目标请求 */
export interface CreateGoalRequest {
  type: 'weight' | 'body_fat' | 'muscle_mass' | 'strength' | 'custom'
  name: string
  target_value: number
  current_value: number
  unit: string
  target_date?: string
}

/** 更新目标请求 */
export interface UpdateGoalRequest {
  current_value?: number
  target_value?: number
  target_date?: string
  status?: 'active' | 'completed' | 'abandoned'
}

/** 体重趋势数据 */
export interface WeightTrend {
  date: string
  weight: number
  bodyFat?: number
}

/** FFMI趋势数据 */
export interface FFMITrend {
  date: string
  ffmi: number
  leanBodyMass: number
}

/** 训练日历数据 */
export interface TrainingCalendarDay {
  date: string
  hasTraining: boolean
  sessionCount: number
  totalVolume: number
  feeling?: 'excellent' | 'good' | 'fair' | 'poor'
}

/** 进度概览 */
export interface ProgressOverview {
  weightTrend: WeightTrend[]
  ffmiTrend: FFMITrend[]
  trainingCalendar: TrainingCalendarDay[]
  activeGoals: FitnessGoal[]
  recentRecords: ProgressRecord[]
  stats: {
    totalRecords: number
    currentWeight: number
    weightChange: number // 相比起始
    currentBodyFat?: number
    bodyFatChange?: number
    currentFFMI?: number
    ffmiChange?: number
    trainingDaysThisMonth: number
    trainingDaysLastMonth: number
  }
}

/** API响应 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// ============ API函数 ============

/**
 * 获取进度记录列表
 * GET /api/progress/records
 */
export const getProgressRecords = (params?: {
  start_date?: string
  end_date?: string
  page?: number
  per_page?: number
}): Promise<ApiResponse<{
  data: ProgressRecord[]
  total: number
  currentPage: number
  lastPage: number
}>> => {
  return api.get('/progress/records', { params })
}

/**
 * 获取单条进度记录
 * GET /api/progress/records/:id
 */
export const getProgressRecord = (
  id: number
): Promise<ApiResponse<ProgressRecord>> => {
  return api.get(`/progress/records/${id}`)
}

/**
 * 创建进度记录
 * POST /api/progress/records
 */
export const createProgressRecord = (
  data: CreateProgressRecordRequest
): Promise<ApiResponse<ProgressRecord>> => {
  return api.post('/progress/records', data)
}

/**
 * 更新进度记录
 * PUT /api/progress/records/:id
 */
export const updateProgressRecord = (
  id: number,
  data: UpdateProgressRecordRequest
): Promise<ApiResponse<ProgressRecord>> => {
  return api.put(`/progress/records/${id}`, data)
}

/**
 * 删除进度记录
 * DELETE /api/progress/records/:id
 */
export const deleteProgressRecord = (
  id: number
): Promise<ApiResponse<null>> => {
  return api.delete(`/progress/records/${id}`)
}

/**
 * 获取目标列表
 * GET /api/progress/goals
 */
export const getGoals = (params?: {
  status?: 'active' | 'completed' | 'abandoned' | 'all'
}): Promise<ApiResponse<FitnessGoal[]>> => {
  return api.get('/progress/goals', { params })
}

/**
 * 获取单个目标
 * GET /api/progress/goals/:id
 */
export const getGoal = (
  id: number
): Promise<ApiResponse<FitnessGoal>> => {
  return api.get(`/progress/goals/${id}`)
}

/**
 * 创建目标
 * POST /api/progress/goals
 */
export const createGoal = (
  data: CreateGoalRequest
): Promise<ApiResponse<FitnessGoal>> => {
  return api.post('/progress/goals', data)
}

/**
 * 更新目标
 * PUT /api/progress/goals/:id
 */
export const updateGoal = (
  id: number,
  data: UpdateGoalRequest
): Promise<ApiResponse<FitnessGoal>> => {
  return api.put(`/progress/goals/${id}`, data)
}

/**
 * 删除目标
 * DELETE /api/progress/goals/:id
 */
export const deleteGoal = (
  id: number
): Promise<ApiResponse<null>> => {
  return api.delete(`/progress/goals/${id}`)
}

/**
 * 获取进度概览
 * GET /api/progress/overview
 */
export const getProgressOverview = (params?: {
  start_date?: string
  end_date?: string
}): Promise<ApiResponse<ProgressOverview>> => {
  return api.get('/progress/overview', { params })
}

/**
 * 获取体重趋势
 * GET /api/progress/trends/weight
 */
export const getWeightTrend = (params?: {
  start_date?: string
  end_date?: string
}): Promise<ApiResponse<WeightTrend[]>> => {
  return api.get('/progress/trends/weight', { params })
}

/**
 * 获取FFMI趋势
 * GET /api/progress/trends/ffmi
 */
export const getFFMITrend = (params?: {
  start_date?: string
  end_date?: string
}): Promise<ApiResponse<FFMITrend[]>> => {
  return api.get('/progress/trends/ffmi', { params })
}

/**
 * 获取训练日历数据
 * GET /api/progress/calendar
 */
export const getTrainingCalendar = (params: {
  year: number
  month: number
}): Promise<ApiResponse<TrainingCalendarDay[]>> => {
  return api.get('/progress/calendar', { params })
}
