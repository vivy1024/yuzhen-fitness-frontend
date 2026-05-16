/**
 * 训练计划数据适配器
 *
 * 将 DAML-RAG generate_training_cycle 的输出格式
 * 转换为前端 TrainingPlanCard 组件期望的 TrainingPlan 接口。
 *
 * @version 1.0.0
 * @date 2026-05-16
 */

import type { TrainingPlan, TrainingDay, TrainingDayExercise } from '@/components/training/TrainingPlanCard.vue'

// === DAML-RAG generate_training_cycle 输出格式 ===

interface RawSession {
  day?: string
  day_number?: number
  focus?: string | string[]
  exercises: RawExercise[]
}

interface RawExercise {
  id?: string
  name?: string
  name_zh?: string
  sets?: number
  reps?: string | number | [number, number]
  intensity?: string
  rest?: number
  rest_seconds?: number
  progression?: string
  weight?: string
}

interface RawTrainingCycle {
  cycle_type?: string
  goal?: string
  training_level?: string
  days_per_week?: number
  cycle_weeks?: number
  deload_week?: number
  sessions?: RawSession[]
  progression_rules?: string
  deload_protocol?: string
}

// === 转换函数 ===

/**
 * 解析 reps 字段为 [min, max] 范围
 */
function parseRepsRange(reps: string | number | [number, number] | undefined): [number, number] {
  if (!reps) return [8, 12]
  if (Array.isArray(reps)) return [reps[0], reps[1]]
  if (typeof reps === 'number') return [reps, reps]

  // 字符串格式："8-12" / "8" / "6-8次"
  const cleaned = String(reps).replace(/[次rep]/gi, '').trim()
  const match = cleaned.match(/(\d+)\s*[-–~]\s*(\d+)/)
  if (match) return [parseInt(match[1]), parseInt(match[2])]

  const single = parseInt(cleaned)
  if (!isNaN(single)) return [single, single]

  return [8, 12]
}

/**
 * 解析 focus 字段为肌群数组
 */
function parseFocusMuscles(focus: string | string[] | undefined): string[] {
  if (!focus) return []
  if (Array.isArray(focus)) return focus

  // "胸+三头" / "胸、肩、三头" / "上肢推"
  return focus.split(/[+、,，/]/).map(s => s.trim()).filter(Boolean)
}

/**
 * 统计总动作数
 */
function countTotalExercises(sessions: RawSession[] | undefined): number {
  if (!sessions) return 0
  return sessions.reduce((sum, s) => sum + (s.exercises?.length || 0), 0)
}

/**
 * 估算每周训练时长（分钟）
 */
function estimateWeeklyDuration(sessions: RawSession[] | undefined): number {
  if (!sessions) return 0
  // 每个动作约 4 分钟（含组间休息），加上热身 10 分钟
  return sessions.reduce((sum, s) => {
    const exerciseTime = (s.exercises?.length || 0) * 4
    return sum + exerciseTime + 10
  }, 0)
}

/**
 * 将 generate_training_cycle 输出转换为 TrainingPlan 接口
 */
export function adaptTrainingCycleToTrainingPlan(raw: RawTrainingCycle): TrainingPlan {
  const sessions = raw.sessions || []

  return {
    program_overview: {
      training_goal: raw.goal || 'hypertrophy',
      training_split: raw.cycle_type || 'custom',
      training_days_per_week: raw.days_per_week || sessions.length,
      difficulty_level: raw.training_level || 'intermediate',
      total_exercises: countTotalExercises(sessions),
      estimated_weekly_duration_minutes: estimateWeeklyDuration(sessions),
    },
    weekly_program: {
      training_days: sessions.map((session, idx): TrainingDay => ({
        day_number: session.day_number || idx + 1,
        day_name: session.day || `Day ${idx + 1}`,
        focus_muscle_groups: parseFocusMuscles(session.focus),
        exercises: (session.exercises || []).map((ex): TrainingDayExercise => ({
          exercise_id: ex.id || null,
          name_zh: ex.name_zh || ex.name || '未知动作',
          sets: ex.sets || 3,
          reps_range: parseRepsRange(ex.reps),
          rest_seconds: ex.rest_seconds || ex.rest || 90,
          weight: ex.weight || ex.intensity || undefined,
        })),
        total_sets: (session.exercises || []).reduce((sum, ex) => sum + (ex.sets || 3), 0),
        estimated_duration_minutes: (session.exercises?.length || 0) * 4 + 10,
      })),
    },
    program_balance: {
      balance_score: 80, // 默认值，后续可从工具结果中获取
    },
    safety_assessment: {
      overall_risk_level: 'LOW',
      safety_recommendations: [],
      personalized_notes: [],
    },
  }
}

/**
 * 尝试从任意工具结果中提取训练计划
 * 兼容多种可能的输出格式
 */
export function tryExtractTrainingPlan(result: unknown): TrainingPlan | null {
  if (!result || typeof result !== 'object') return null

  const data = result as Record<string, unknown>

  // 格式 1：已经是 TrainingPlan 格式（有 program_overview）
  if (data.program_overview && data.weekly_program) {
    return data as unknown as TrainingPlan
  }

  // 格式 2：generate_training_cycle 输出（有 sessions）
  if (data.sessions && Array.isArray(data.sessions)) {
    return adaptTrainingCycleToTrainingPlan(data as RawTrainingCycle)
  }

  // 格式 3：嵌套在 content 字段中
  if (data.content && typeof data.content === 'object') {
    return tryExtractTrainingPlan(data.content)
  }

  // 格式 4：JSON 字符串
  if (typeof data.content === 'string') {
    try {
      const parsed = JSON.parse(data.content)
      return tryExtractTrainingPlan(parsed)
    } catch {
      return null
    }
  }

  return null
}
