/**
 * 工具调用数据适配器
 *
 * 从 useYuzhenChat 的 ToolCallInfo[] 中提取结构化数据，
 * 供 MessageItemNew 渲染训练计划、动作列表等。
 *
 * @version 1.0.0
 * @date 2026-05-16
 */

import type { ToolCallInfo } from '@/composables/useYuzhenChat'
import type { TrainingPlan } from '@/components/training/TrainingPlanCard.vue'
import { tryExtractTrainingPlan } from './trainingPlanAdapter'

/**
 * 从 MCP 工具名中提取实际工具名
 * "mcp__DAML_RAG_________search_exercises" → "search_exercises"
 */
export function extractToolName(fullName: string): string {
  if (fullName.startsWith('mcp__')) {
    const lastSep = fullName.lastIndexOf('__')
    if (lastSep > 4) return fullName.slice(lastSep + 2)
  }
  return fullName
}

/**
 * 训练计划相关的工具名
 */
const PLAN_TOOL_NAMES = new Set([
  'generate_training_cycle',
  'design_training_split',
  'professional_program_designer',
])

/**
 * 从工具调用列表中提取训练计划
 */
export function extractTrainingPlanFromToolCalls(toolCalls: ToolCallInfo[]): TrainingPlan | null {
  if (!toolCalls || toolCalls.length === 0) return null

  for (const tc of toolCalls) {
    const name = extractToolName(tc.toolName)
    if (!PLAN_TOOL_NAMES.has(name)) continue
    if (tc.status !== 'success' || !tc.result) continue

    const result = typeof tc.result === 'string' ? safeJsonParse(tc.result) : tc.result
    if (!result) continue

    const plan = tryExtractTrainingPlan(result)
    if (plan) return plan
  }

  return null
}

/**
 * 动作搜索相关的工具名
 */
const EXERCISE_TOOL_NAMES = new Set([
  'search_exercises',
  'find_alternatives',
  'get_muscle_exercise_map',
])

/**
 * 从工具调用列表中提取动作搜索结果
 */
export function extractExerciseResultFromToolCalls(toolCalls: ToolCallInfo[]): any | null {
  if (!toolCalls || toolCalls.length === 0) return null

  for (const tc of toolCalls) {
    const name = extractToolName(tc.toolName)
    if (!EXERCISE_TOOL_NAMES.has(name)) continue
    if (tc.status !== 'success' || !tc.result) continue

    const result = typeof tc.result === 'string' ? safeJsonParse(tc.result) : tc.result
    if (!result) continue

    // 检查是否有 exercises 数组
    if (result.exercises && Array.isArray(result.exercises) && result.exercises.length > 0) {
      return result
    }
  }

  return null
}

/**
 * 判断工具调用是否包含需要特殊渲染的结果
 */
export function hasSpecialRenderResult(toolCalls: ToolCallInfo[]): {
  hasPlan: boolean
  hasExercises: boolean
} {
  return {
    hasPlan: extractTrainingPlanFromToolCalls(toolCalls) !== null,
    hasExercises: extractExerciseResultFromToolCalls(toolCalls) !== null,
  }
}

/**
 * 安全 JSON 解析
 */
function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}
