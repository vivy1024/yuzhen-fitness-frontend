/**
 * 训练会话API
 * 提供训练记录、历史、统计等接口
 * 
 * @author BUILD_BODY Team
 * @version 1.0.0
 * @created 2025-01-04
 */

import api from './auth'

// ============ 类型定义 ============

/** 组记录 */
export interface SetRecord {
  setNumber: number
  weight: number // kg
  reps: number
  rpe: number // 1-10
  rest: number // 秒
  completed: boolean
}

/** 动作记录 */
export interface ExerciseRecord {
  exerciseId: number
  name: string
  sets: SetRecord[]
  notes?: string
}

/** 训练会话 */
export interface TrainingSession {
  id: number
  userId: number
  planId?: number
  date: string
  startTime: string
  endTime?: string
  duration?: number // 分钟
  exercises: ExerciseRecord[]
  totalVolume: number // 总训练量 (kg)
  totalSets: number
  averageRPE: number
  feeling: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
  status: 'in_progress' | 'completed'
  createdAt: string
  updatedAt: string
}

/** 创建训练会话请求 */
export interface CreateSessionRequest {
  plan_id?: number
  date: string
  start_time: string
  exercises: {
    exercise_id: number
    name: string
    sets: {
      set_number: number
      weight: number
      reps: number
      rpe: number
      rest: number
      completed: boolean
    }[]
    notes?: string
  }[]
  feeling?: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
}

/** 更新训练会话请求 */
export interface UpdateSessionRequest {
  end_time?: string
  exercises?: {
    exercise_id: number
    name: string
    sets: {
      set_number: number
      weight: number
      reps: number
      rpe: number
      rest: number
      completed: boolean
    }[]
    notes?: string
  }[]
  feeling?: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
  status?: 'in_progress' | 'completed'
}

/** 训练统计 */
export interface TrainingStats {
  totalSessions: number
  totalVolume: number // kg
  totalSets: number
  averageRPE: number
  trainingFrequency: number // 每周训练次数
  currentStreak: number // 当前连续训练天数
  longestStreak: number // 最长连续训练天数
  volumeTrend: {
    date: string
    volume: number
  }[]
  frequencyTrend: {
    week: string
    sessions: number
  }[]
  progressTrend: {
    exerciseId: number
    exerciseName: string
    data: {
      date: string
      weight: number
      reps: number
      volume: number
    }[]
  }[]
}

/** API响应 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

// ============ API函数 ============

/**
 * 创建训练会话
 * POST /api/training-logs/session
 */
export const createTrainingSession = (
  data: CreateSessionRequest
): Promise<ApiResponse<TrainingSession>> => {
  return api.post('/training-logs/session', data)
}

/**
 * 获取训练历史
 * GET /api/training-logs
 */
export const getTrainingSessions = (params?: {
  plan_id?: number
  start_date?: string
  end_date?: string
  status?: 'in_progress' | 'completed'
  page?: number
  per_page?: number
}): Promise<ApiResponse<{
  data: TrainingSession[]
  total: number
  currentPage: number
  lastPage: number
}>> => {
  return api.get('/training-logs', { params })
}

/**
 * 获取训练详情
 * GET /api/training-logs/:id
 */
export const getTrainingSessionDetail = (
  id: number
): Promise<ApiResponse<TrainingSession>> => {
  return api.get(`/training-logs/${id}`)
}

/**
 * 更新训练会话
 * PUT /api/training-logs/:id
 */
export const updateTrainingSession = (
  id: number,
  data: UpdateSessionRequest
): Promise<ApiResponse<TrainingSession>> => {
  return api.put(`/training-logs/${id}`, data)
}

/**
 * 删除训练会话
 * DELETE /api/training-logs/:id
 */
export const deleteTrainingSession = (
  id: number
): Promise<ApiResponse<null>> => {
  return api.delete(`/training-logs/${id}`)
}

/**
 * 获取训练统计
 * GET /api/training-logs/stats
 */
export const getTrainingStats = (params?: {
  start_date?: string
  end_date?: string
  plan_id?: number
}): Promise<ApiResponse<TrainingStats>> => {
  return api.get('/training-logs/stats', { params })
}

/**
 * 完成训练会话
 * POST /api/training-logs/:id/complete
 */
export const completeTrainingSession = (
  id: number
): Promise<ApiResponse<TrainingSession>> => {
  return api.post(`/training-logs/${id}/complete`)
}

/**
 * 从训练计划创建会话
 * POST /api/training-logs/from-plan
 */
export const createSessionFromPlan = (
  planId: number,
  date: string
): Promise<ApiResponse<TrainingSession>> => {
  return api.post('/training-logs/from-plan', {
    plan_id: planId,
    date,
  })
}
