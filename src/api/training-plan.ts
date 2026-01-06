/**
 * 训练计划API
 * 提供训练计划的导入、查询、更新和删除接口
 */

import api from './auth'

export interface TrainingPlanImportData {
  name: string
  description?: string
  weeks: number
  frequency: number
  exercises: any[]
  target_muscles?: string[]
  safety_notes?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  chat_session_id?: number
}

export interface TrainingPlanResponse {
  id: number
  name: string
  description?: string
  weeks: number
  frequency: number
  difficulty?: string
  goal?: string
  isActive: boolean
  type: string
  exerciseCount: number
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export interface TrainingPlanDetail extends TrainingPlanResponse {
  exercises: any[]
  targetMuscles?: string[]
  safetyNotes?: string[]
  chatSessionId?: number
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/**
 * 导入训练计划
 * POST /api/training/plans/import
 */
export const importTrainingPlan = (data: TrainingPlanImportData): Promise<ApiResponse<{ id: number; name: string; createdAt: string }>> => {
  return api.post('/training/plans/import', data)
}

/**
 * 获取训练计划列表
 * GET /api/training/plans
 */
export const getTrainingPlans = (params?: {
  status?: 'active' | 'completed'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  goal?: string
}): Promise<ApiResponse<TrainingPlanResponse[]>> => {
  return api.get('/training/plans', { params })
}

/**
 * 获取训练计划详情
 * GET /api/training/plans/:id
 */
export const getTrainingPlanDetail = (id: number): Promise<ApiResponse<TrainingPlanDetail>> => {
  return api.get(`/training/plans/${id}`)
}

/**
 * 更新训练计划
 * PUT /api/training/plans/:id
 */
export const updateTrainingPlan = (id: number, data: {
  name?: string
  description?: string
  is_active?: boolean
  started_at?: string
  completed_at?: string
}): Promise<ApiResponse<{ id: number; name: string; updatedAt: string }>> => {
  return api.put(`/training/plans/${id}`, data)
}

/**
 * 删除训练计划
 * DELETE /api/training/plans/:id
 */
export const deleteTrainingPlan = (id: number): Promise<ApiResponse<null>> => {
  return api.delete(`/training/plans/${id}`)
}

/**
 * 激活训练计划（设为当前计划）
 * POST /api/training/plans/:id/activate
 */
export const activateTrainingPlan = (id: number): Promise<ApiResponse<{ id: number; isActive: boolean }>> => {
  return api.post(`/training/plans/${id}/activate`)
}

/**
 * 导出训练计划
 * POST /api/training/plans/:id/export
 * @param format - 导出格式：'json' | 'pdf'
 */
export const exportTrainingPlan = (id: number, format: 'json' | 'pdf' = 'json'): Promise<ApiResponse<{ url: string; filename: string }>> => {
  return api.post(`/training/plans/${id}/export`, { format })
}

/**
 * 开始训练计划
 * POST /api/training/plans/:id/start
 */
export const startTrainingPlan = (id: number): Promise<ApiResponse<{ id: number; startedAt: string }>> => {
  return api.post(`/training/plans/${id}/start`)
}
