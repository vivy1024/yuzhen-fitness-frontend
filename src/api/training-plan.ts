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
  planExercises?: PlanExerciseItem[]
  nutritionPlans?: NutritionPlanDetail[]
  targetMuscles?: string[]
  safetyNotes?: string[]
  chatSessionId?: number
}

export interface NutritionPlanDetail {
  id?: number
  foodId?: number
  foodName: string
  mealType: string
  portionGrams: number
  dayOfWeek?: number
  notes?: string
  nutrition?: {
    energyKcal?: number
    protein?: number
    carbohydrate?: number
    fat?: number
  }
}

export interface PlanExerciseItem {
  id?: number
  exerciseId?: number
  exerciseName: string
  dayOfWeek?: number
  sets: number
  reps: string
  weight?: string
  restTime?: string
  notes?: string
  orderIndex?: number
}

export interface CreatePlanData {
  name: string
  description?: string
  goal?: 'hypertrophy' | 'fat_loss' | 'strength' | 'endurance' | 'body_shaping' | 'general_fitness'
  difficulty?: 'novice' | 'beginner' | 'intermediate' | 'advanced'
  duration_weeks: number
  workouts_per_week: number
  exercises: {
    exercise_id?: number
    exercise_name: string
    day_of_week?: number
    sets: number
    reps: string
    weight?: string
    rest_time?: string
    notes?: string
    order_index?: number
  }[]
  nutrition?: {
    food_id?: number
    food_name: string
    meal_type: string
    portion_grams: number
    day_of_week?: number
    notes?: string
  }[]
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
  type?: 'manual' | 'ai_generated'
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
 * 手动创建训练计划
 * POST /api/training/plans
 */
export const createTrainingPlan = (data: CreatePlanData): Promise<ApiResponse<{ id: number; name: string; exerciseCount: number; createdAt: string }>> => {
  return api.post('/training/plans', data)
}

/**
 * 更新训练计划（含动作同步）
 * PUT /api/training/plans/:id
 */
export const updateTrainingPlan = (id: number, data: Partial<CreatePlanData>): Promise<ApiResponse<{ id: number; name: string; exerciseCount: number; updatedAt: string }>> => {
  return api.put(`/training/plans/${id}`, data)
}

/**
 * 复制训练计划
 * POST /api/training/plans/:id/copy
 */
export const copyTrainingPlan = (id: number): Promise<ApiResponse<{ id: number; name: string; exerciseCount: number; createdAt: string }>> => {
  return api.post(`/training/plans/${id}/copy`)
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

// ========== 模板 API ==========

export interface PlanTemplate {
  id: number
  name: string
  description: string
  goal: string
  level: string
  duration_weeks: number
  workouts_per_week: number
  exercises_count: number
}

/**
 * 获取官方模板列表
 * GET /api/training/templates
 */
export const getTemplates = (params?: {
  goal?: string
  level?: string
}): Promise<ApiResponse<PlanTemplate[]>> => {
  return api.get('/training/templates', { params })
}

/**
 * 从模板创建计划
 * POST /api/training/templates/:id/use
 */
export const useTemplate = (id: number): Promise<ApiResponse<{ id: number; name: string }>> => {
  return api.post(`/training/templates/${id}/use`)
}
