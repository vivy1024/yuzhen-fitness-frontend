/**
 * 计算器 API 模块
 * 7 个健身计算器的前端调用接口，对应 POST /api/calculators/*
 * 无需认证，登录用户可选 save_to_profile 保存结果
 */

import api from './auth'
import type { ApiResponse } from './auth'

// ============ 类型定义 ============

export interface TDEEParams {
  age: number
  gender: 'male' | 'female'
  weight_kg: number
  height_cm: number
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active'
  fitness_goal: 'fat_loss' | 'mild_fat_loss' | 'maintenance' | 'lean_bulk' | 'hypertrophy' | 'recomp'
  save_to_profile?: boolean
}

export interface TDEEResult {
  bmr: number
  tdee: number
  target_calories: number
  deficit_or_surplus: number
  fitness_goal: string
  formula_used: string
  macros: {
    protein_g: number
    fat_g: number
    carbs_g: number
    ratios: { protein: number; fat: number; carbs: number }
  }
}

export interface FFMIParams {
  height_cm: number
  weight_kg: number
  gender: 'male' | 'female'
  body_fat?: number
  save_to_profile?: boolean
}

export interface FFMIResult {
  bmi: number
  bmi_status: string
  body_fat_used: number
  used_estimated_bf: boolean
  lean_body_mass: number
  ffmi: number
  normalized_ffmi: number
  assessment: string
  natural_potential: { percentage: number; description: string }
  training_recommendation: { focus: string; suggestions: string[] }
}

export interface OneRMParams {
  weight_kg: number
  reps: number
  formula?: 'epley' | 'brzycki' | 'average'
}

export interface OneRMResult {
  estimated_1rm: number
  formula_used: string
  formulas: { epley: number; brzycki: number; average: number }
  percentage_table: Array<{ percentage: number; weight: number; typical_reps: string }>
}

export interface IntensityParams {
  input_type: 'rpe' | 'rir' | 'percentage'
  value: number
}

export interface IntensityResult {
  rpe: number
  rir: number
  percentage_1rm: number
  description: string
}

export interface WeightParams {
  estimated_1rm: number
  training_goal: 'strength' | 'hypertrophy' | 'endurance' | 'power'
  target_reps?: number
  target_rpe?: number
}

export interface WeightResult {
  recommended_weight: number
  weight_range: { min: number; max: number }
  percentage_range: { min: number; max: number }
  training_goal: string
  rep_range: { min: number; max: number }
}

export interface CarbCyclingParams {
  tdee: number
  weight_kg: number
  fitness_goal: 'fat_loss' | 'mild_fat_loss' | 'maintenance' | 'lean_bulk' | 'hypertrophy' | 'recomp'
  training_days: number[]
  save_to_profile?: boolean
}

export interface CarbCyclingResult {
  weekly_plan: Array<{
    day: number
    day_name: string
    is_training: boolean
    carb_type: 'high' | 'medium' | 'low'
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }>
  weekly_average_calories: number
  weekly_total_calories: number
  high_carb_days: number
  medium_carb_days: number
  low_carb_days: number
  constant_protein_g: number
  tdee_reference: number
}

export interface MacroParams {
  target_calories: number
  weight_kg: number
  fitness_goal: 'fat_loss' | 'mild_fat_loss' | 'maintenance' | 'lean_bulk' | 'hypertrophy' | 'recomp'
  method?: 'balanced' | 'body_weight' | 'ratio'
  save_to_profile?: boolean
}

export interface MacroResult {
  macros: {
    protein_g: number
    protein_cal: number
    carbs_g: number
    carbs_cal: number
    fat_g: number
    fat_cal: number
  }
  ratios: { protein: number; carbs: number; fat: number }
  per_kg: { protein: number; carbs: number; fat: number }
  total_calories: number
  target_calories: number
  fitness_goal: string
  method: string
}

// ============ API 函数 ============

export const calculateTDEE = (params: TDEEParams): Promise<ApiResponse<TDEEResult>> =>
  api.post('/calculators/tdee', params)

export const calculateFFMI = (params: FFMIParams): Promise<ApiResponse<FFMIResult>> =>
  api.post('/calculators/ffmi', params)

export const calculateOneRM = (params: OneRMParams): Promise<ApiResponse<OneRMResult>> =>
  api.post('/calculators/one-rm', params)

export const convertIntensity = (params: IntensityParams): Promise<ApiResponse<IntensityResult>> =>
  api.post('/calculators/intensity', params)

export const recommendWeight = (params: WeightParams): Promise<ApiResponse<WeightResult>> =>
  api.post('/calculators/weight', params)

export const calculateCarbCycling = (params: CarbCyclingParams): Promise<ApiResponse<CarbCyclingResult>> =>
  api.post('/calculators/carb-cycling', params)

export const calculateMacros = (params: MacroParams): Promise<ApiResponse<MacroResult>> =>
  api.post('/calculators/macros', params)
