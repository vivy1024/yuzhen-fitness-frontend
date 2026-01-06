/**
 * 动作库类型定义
 * 复刻自 yuzhen_fitness_v2
 * 
 * @version 2.2.0
 * @date 2026-01-04
 * @changes 添加增强字段：训练参数、安全信息、技术要点、营养建议
 */

// ==================== 安全等级类型 ====================

/**
 * 安全等级类型
 * - LOW_RISK: 低风险
 * - MODERATE_RISK: 中等风险
 * - HIGH_RISK: 高风险
 */
export type SafetyLevel = 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK'

/**
 * 运动链类型
 * - open_chain: 开链运动
 * - closed_chain: 闭链运动
 * - mixed: 混合
 */
export type KineticChainType = 'open_chain' | 'closed_chain' | 'mixed'

// ==================== 基础动作类型 ====================

export interface ExerciseBasic {
  id: number
  name: string
  name_zh: string
  primary_muscle: string
  primary_muscle_zh: string
  secondary_muscles?: string[]
  secondary_muscles_zh?: string[]
  equipment: string
  equipment_zh?: string
  // 难度可能是字符串或对象格式
  difficulty: string | { id?: number; name?: string; name_zh?: string; name_en_us?: string }
  difficulty_zh?: string
  image_url?: string
  thumbnail_urls?: {
    primary?: string
    [key: string]: string | undefined
  }
  image_urls?: {
    male?: { angle_1?: string; angle_2?: string }
    female?: { angle_1?: string; angle_2?: string }
  }
}

// ==================== 动作详情类型 ====================

// ==================== 人体图类型 ====================

export interface BodyMapGender {
  front?: string
  back?: string
}

export interface BodyMapImages {
  male?: BodyMapGender
  female?: BodyMapGender
}

export interface ExerciseDetail extends ExerciseBasic {
  description?: string
  description_zh?: string
  // 正确步骤（后端升级字段）
  correct_steps?: Array<{
    id: number
    order: number
    text: string
    text_en_us?: string
  }> | string[]
  correct_steps_zh?: string[]
  // 所有肌群
  all_muscles?: string[]
  
  // ========== 人体图字段 (v2.3.0新增) ==========
  /** 身体部位图（MuscleWiki远程URL） */
  body_map_images?: BodyMapImages
  /** 身体部位图（本地路径） */
  body_map_images_local?: BodyMapImages
  /** 主要肌肉（从API更新） */
  muscles_primary?: string[]
  /** 次要肌肉（从API更新） */
  muscles_secondary?: string[]
  /** 变体来源（该动作是哪个动作的变体） */
  variation_of?: number | null
  /** 变体列表（该动作有哪些变体） */
  variations?: number[]
  /** 涉及关节 */
  joints?: string[]
  // 力量类型（对象格式）
  force?: string | { id: number; name: string; name_zh: string; description?: string }
  force_zh?: string
  // 运动机制（对象格式）
  mechanic?: string | { id: number; name: string; name_zh: string; description?: string }
  mechanic_zh?: string
  // 握法（数组格式）
  grips?: Array<{ id: number; name: string; name_zh: string; description?: string }>
  grips_zh?: string[]
  // 难度（对象格式）
  difficulty_obj?: { id: number; name: string; name_zh: string }
  // 媒体资源
  media?: {
    images?: {
      male?: { angle_1?: string; angle_2?: string }
      female?: { angle_1?: string; angle_2?: string }
    }
    videos?: {
      male?: { angle_1?: string; angle_2?: string }
      female?: { angle_1?: string; angle_2?: string }
    }
    thumbnails?: { primary?: string; gallery?: string[] }
  }
  // 智能标签
  smart_tags?: string[]
  // 元数据
  metadata?: {
    source?: string
    version?: string
    has_detail_info?: boolean
    has_steps?: boolean
  }

  // ========== 训练参数字段 (v2.2.0新增) ==========
  /** 推荐次数范围，如 "6-12" */
  rep_range?: string
  /** 推荐组数范围，如 "3-4" */
  set_range?: string
  /** 推荐休息时间，如 "90-120秒" */
  rest_period?: string
  /** 训练强度百分比，如 "70-80%" */
  intensity_percentage?: string

  // ========== 安全信息字段 (v2.2.0新增) ==========
  /** 安全等级: LOW_RISK/MODERATE_RISK/HIGH_RISK */
  safety_level?: SafetyLevel
  /** 训练前检查项列表 */
  safety_pre_check?: string[]
  /** 器械风险列表 */
  equipment_risks?: string[]
  /** 安全警告信息 */
  safety_warning_signs?: string
  /** 禁忌条件列表 */
  contraindications?: string[]
  /** 是否为高风险动作 */
  is_high_risk?: boolean

  // ========== 技术要点字段 (v2.2.0新增) ==========
  /** 运动链类型: open_chain/closed_chain/mixed */
  kinetic_chain_type?: KineticChainType
  /** 技术检查点列表 */
  technique_checkpoints?: string[]
  /** 关节活动度要求，如 { elbow_flexion: 140 } */
  rom_requirements?: Record<string, number>

  // ========== 营养建议字段 (v2.2.0新增) ==========
  /** 关键营养素列表 */
  key_nutrients?: string[]
  /** 推荐食物列表 */
  recommended_foods?: string[]
  /** 营养补充时机 */
  nutrition_timing?: string

  // ========== 进阶相关字段 ==========
  /** 进阶动作选项 */
  progression_options?: string[] | Array<{ id: number; name: string; name_zh?: string }>
  /** 退阶动作选项 */
  regression_options?: string[] | Array<{ id: number; name: string; name_zh?: string }>

  // 旧字段兼容
  instructions?: string[]
  instructions_zh?: string[]
  tips?: string[]
  tips_zh?: string[]
  warnings?: string[]
  warnings_zh?: string[]
  video_url?: string
  video_urls?: { male?: string; female?: string }
  sets_recommendation?: string
  reps_recommendation?: string
  rest_recommendation?: string
  tempo_recommendation?: string
  data_source?: string
  created_at?: string
  updated_at?: string
}

// ==================== 筛选相关类型 ====================

export interface FilterOption {
  value: string
  label: string
  count?: number
  icon?: string
}

export interface FilterOptions {
  muscle: FilterOption[]
  equipment: FilterOption[]
  difficulty: FilterOption[]
  grip: FilterOption[]
  mechanic: FilterOption[]
  force: FilterOption[]
  kinetic_chain: FilterOption[]
  safety_level: FilterOption[]
}

export interface FilterConditions {
  muscle?: string[]
  equipment?: string[]
  difficulty?: string[]
  grip?: string[]
  mechanic?: string[]
  force?: string[]
  kinetic_chain?: string[]
  safety_level?: string[]
  has_video?: boolean
}

// ==================== 分页类型 ====================

export interface PaginationInfo {
  current: number
  pageSize: number
  total: number
  totalPages: number
}

// ==================== 肌群类型 ====================

export interface MuscleGroup {
  id: string
  name_zh: string
  count: number
  icon?: string
}

// ==================== 性别类型 ====================

export type Gender = 'male' | 'female'

// ==================== 安全等级相关常量 (v2.2.0新增) ====================

/**
 * 安全等级显示名称映射
 */
export const SAFETY_LEVEL_LABELS: Record<SafetyLevel, string> = {
  LOW_RISK: '低风险',
  MODERATE_RISK: '中等风险',
  HIGH_RISK: '高风险',
}

/**
 * 安全等级颜色映射（用于UI显示）
 */
export const SAFETY_LEVEL_COLORS: Record<SafetyLevel, string> = {
  LOW_RISK: 'positive',
  MODERATE_RISK: 'warning',
  HIGH_RISK: 'negative',
}

/**
 * 运动链类型显示名称映射
 */
export const KINETIC_CHAIN_LABELS: Record<KineticChainType, string> = {
  open_chain: '开链运动',
  closed_chain: '闭链运动',
  mixed: '混合运动',
}
