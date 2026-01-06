/**
 * 用户档案系统类型定义
 * 复刻自 yuzhen_fitness_v2
 */

// ==================== 枚举和字面量类型 ====================

export type FitnessLevel = 'beginner' | 'novice' | 'intermediate' | 'advanced'
export type Gender = 'male' | 'female'
export type TrainingSplit = '全身训练' | '上下分化' | '推拉腿' | '三分化' | '四分化' | '五分化'
export type TrainingLocation = '健身房' | '家里' | '户外' | '混合'
export type TrainingIntensity = 'low' | 'moderate' | 'high'
export type RestPattern = '练一休一' | '练二休一' | '练三休一' | '练四休一' | '练五休一' | '练六休一' | '练七休一'
export type BudgetLevel = 'low' | 'moderate' | 'high'
export type BMIStatus = 'underweight' | 'normal' | 'overweight' | 'obese'

// ==================== 基础信息 ====================

export interface BasicInfo {
  nickname: string
  age: number
  gender: Gender
  height: number
  weight: number
  body_fat_percentage?: number
  fitness_level: FitnessLevel
  region?: string
  sleep_hours?: number
}

// ==================== 健身目标 ====================

export interface FitnessGoals {
  primary_goal: string  // 主要目标（单选）- 用于匹配TrainingParams节点
  secondary_goals?: string[]  // 次要目标（多选）- 用于动作选择微调
  target_weight?: number
  goal_priority: Record<string, number>
  training_split: TrainingSplit | null
}

// ==================== 训练偏好 ====================

export interface TrainingPreferences {
  training_split: TrainingSplit | null
  available_equipment: string[]
  training_location: TrainingLocation | null
  exercise_preferences?: string[]
  disliked_exercises?: string[]
  training_intensity?: TrainingIntensity
}

// ==================== 力量数据 ====================

export interface ExerciseRM {
  one_rm?: number
  three_rm?: number
}

export interface StrengthData {
  bench_press?: ExerciseRM
  squat?: ExerciseRM
  deadlift?: ExerciseRM
  overhead_press?: ExerciseRM
  pull_up?: ExerciseRM
  dip?: ExerciseRM
}

// ==================== 健康状况 ====================

export interface HealthStatus {
  chronic_diseases: string[]
  injury_history: string[]
  medications: string[]
  postural_issues?: string[]  // 体态问题（新增）
  other_notes?: string
}

// ==================== 体态评估 ====================

export interface PosturalAssessment {
  issues: string[]  // 体态问题列表
  assessment_date?: string  // 评估日期
  notes?: string  // 备注
}

// ==================== 营养档案 ====================

export interface NutritionUserSettings {
  population_type: string
  dietary_preferences: string[]
  allergies: string[]
  supplements: string[]
  budget: BudgetLevel
}

export interface NutritionAutoCalculated {
  daily_calories?: number
  daily_protein?: number
  daily_carbs?: number
  daily_fats?: number
  bmr?: number
  tdee?: number
}

export interface NutritionProfile {
  user_settings: NutritionUserSettings
  auto_calculated?: NutritionAutoCalculated
}

// ==================== FFMI评估 ====================

export interface TrainingRecommendation {
  focus: string
  suggestions: string[]
}

export interface FFMIAssessment {
  bmi: number
  bmi_status: BMIStatus
  lean_body_mass: number
  ffmi: number
  normalized_ffmi: number
  assessment: string
  natural_potential: string
  training_recommendation: TrainingRecommendation
  used_estimated_bf: boolean
  calculated_at: string
}

// ==================== 完整用户档案 ====================

export interface UserProfile {
  user_id: number
  basic_info: BasicInfo
  fitness_goals: FitnessGoals
  training_preferences: TrainingPreferences
  preferred_rest_pattern?: RestPattern
  strength_data?: StrengthData
  health_status: HealthStatus
  nutrition_profile: NutritionProfile
  ffmi_assessment?: FFMIAssessment
  created_at: string
  updated_at: string
  version: number
}

// ==================== 常量定义 ====================

export const PROFILE_STORAGE_KEYS = {
  USER_PROFILE: 'user_profile_v2',
  CURRENT_USER_ID: 'current_user_id',
  LAST_SYNC: 'last_sync_at',
  FFMI_CACHE: 'ffmi_cache_v2',
} as const

export const FITNESS_LEVEL_OPTIONS: Array<{ value: FitnessLevel; label: string; description: string }> = [
  { value: 'beginner', label: '初学者', description: '0-6个月训练经验' },
  { value: 'novice', label: '新手', description: '6-18个月训练经验' },
  { value: 'intermediate', label: '中级', description: '18-36个月训练经验' },
  { value: 'advanced', label: '高级', description: '36个月以上训练经验' },
]

export const TRAINING_SPLIT_OPTIONS: Array<{ value: TrainingSplit; label: string; description: string }> = [
  { value: '全身训练', label: '全身训练', description: '每次训练全身肌群，适合初学者' },
  { value: '上下分化', label: '上下分化', description: '上肢+下肢分开训练' },
  { value: '推拉腿', label: '推拉腿', description: 'Push/Pull/Legs，经典分化' },
  { value: '三分化', label: '三分化', description: '3天一循环，适合中级' },
  { value: '四分化', label: '四分化', description: '4天一循环' },
  { value: '五分化', label: '五分化', description: '5天一循环，单独肌群训练' },
]

export const FITNESS_GOALS_OPTIONS = [
  '增肌', '减脂', '增强力量', '提高耐力', '塑形', '功能性训练', '运动表现', '康复训练',
] as const

/**
 * 训练目标参数配置
 * 基于运动科学原理定义每个训练目标的标准参数
 * 
 * 参数说明:
 * - reps: 每组次数范围
 * - sets: 组数范围
 * - rest_seconds: 组间休息时间范围（秒）
 * - intensity_percent: 负重强度范围（相对于1RM的百分比）
 * - rir_target: 目标RIR（Reps in Reserve，储备次数）
 */
export const TRAINING_GOAL_PARAMS = {
  增肌: {
    name: 'hypertrophy',
    reps: { min: 8, max: 12 },
    sets: { min: 3, max: 4 },
    rest_seconds: { min: 60, max: 90 },
    intensity_percent: { min: 65, max: 75 },
    rir_target: 2,
    description: '中等负重，中等次数，适度休息，追求肌肉泵感和代谢压力',
  },
  减脂: {
    name: 'fat_loss',
    reps: { min: 12, max: 20 },
    sets: { min: 3, max: 5 },
    rest_seconds: { min: 30, max: 45 },
    intensity_percent: { min: 50, max: 65 },
    rir_target: 3,
    description: '轻中负重，高次数，短休息，追求高心率和热量消耗',
  },
  增强力量: {
    name: 'strength',
    reps: { min: 1, max: 5 },
    sets: { min: 4, max: 6 },
    rest_seconds: { min: 180, max: 300 },
    intensity_percent: { min: 85, max: 100 },
    rir_target: 1,
    description: '大负重，低次数，长休息，追求神经适应和最大力量',
  },
  提高耐力: {
    name: 'endurance',
    reps: { min: 15, max: 25 },
    sets: { min: 2, max: 3 },
    rest_seconds: { min: 15, max: 30 },
    intensity_percent: { min: 40, max: 60 },
    rir_target: 4,
    description: '轻负重，高次数，极短休息，追求肌肉耐力和心肺适应',
  },
  塑形: {
    name: 'body_shaping',
    reps: { min: 10, max: 15 },
    sets: { min: 3, max: 4 },
    rest_seconds: { min: 45, max: 60 },
    intensity_percent: { min: 60, max: 70 },
    rir_target: 2,
    description: '中等负重，中高次数，适度休息，追求肌肉线条和体型改善',
  },
  功能性训练: {
    name: 'functional',
    reps: { min: 8, max: 15 },
    sets: { min: 2, max: 4 },
    rest_seconds: { min: 60, max: 90 },
    intensity_percent: { min: 50, max: 70 },
    rir_target: 3,
    description: '多平面动作，复合运动，强调动作质量和身体协调',
  },
  运动表现: {
    name: 'athletic_performance',
    reps: { min: 3, max: 8 },
    sets: { min: 3, max: 5 },
    rest_seconds: { min: 120, max: 180 },
    intensity_percent: { min: 70, max: 90 },
    rir_target: 2,
    description: '爆发力动作，中高负重，充分休息，追求速度和力量输出',
  },
  康复训练: {
    name: 'rehabilitation',
    reps: { min: 12, max: 20 },
    sets: { min: 2, max: 3 },
    rest_seconds: { min: 60, max: 90 },
    intensity_percent: { min: 30, max: 50 },
    rir_target: 5,
    description: '轻负重，高次数，慢节奏，强调控制和关节稳定',
  },
} as const

export type TrainingGoalKey = keyof typeof TRAINING_GOAL_PARAMS

/**
 * 可用器械选项
 * 
 * 与Neo4j Equipment节点完全对应（21个节点）
 * 更新日期: 2026-01-05 (统一化后不再需要映射)
 * 
 * 器械类（16个）:
 * - 杠铃、杠铃片、哑铃、固定器械、自由重量架
 * - 史密斯架、龙门架、弹力带、壶铃、TRX
 * - 药球、波速球、健身球、跳箱、战绳、徒手
 * 
 * 训练类型分类（5个，非器械）:
 * - 恢复、拉伸、有氧训练、瑜伽、Vitruvian
 */
export const EQUIPMENT_OPTIONS = [
  // 基础器械
  '杠铃', '杠铃片', '哑铃', '固定器械', '自由重量架', '史密斯架', '龙门架',
  // 辅助器械
  '弹力带', '壶铃', 'TRX', '药球', '波速球', '健身球', '跳箱', '战绳',
  // 徒手
  '徒手',
] as const

/**
 * 训练类型分类（非器械，用于动作分类）
 */
export const TRAINING_TYPE_CATEGORIES = [
  '恢复', '拉伸', '有氧训练', '瑜伽', 'Vitruvian',
] as const

/**
 * 器械中英文对照（用于Neo4j查询）
 */
export const EQUIPMENT_NAME_MAPPING: Record<string, string> = {
  '杠铃': 'barbell',
  '杠铃片': 'weight_plate',
  '哑铃': 'dumbbell',
  '固定器械': 'machine',
  '自由重量架': 'free_weight_rack',
  '史密斯架': 'smith_machine',
  '龙门架': 'cable_machine',
  '弹力带': 'resistance_band',
  '壶铃': 'kettlebell',
  'TRX': 'trx',
  '药球': 'medicine_ball',
  '波速球': 'bosu_ball',
  '健身球': 'stability_ball',
  '跳箱': 'plyo_box',
  '战绳': 'battle_rope',
  '徒手': 'bodyweight',
  // 训练类型分类
  '恢复': 'recovery',
  '拉伸': 'stretching',
  '有氧训练': 'cardio',
  '瑜伽': 'yoga',
  'Vitruvian': 'vitruvian',
}

export const CHRONIC_DISEASE_OPTIONS = ['无', '高血压', '糖尿病', '心脏病', '哮喘', '关节炎', '其他'] as const

/**
 * 伤病史选项（分组结构）
 * 
 * 与Neo4j InjuryType节点完全对应（21个节点）
 * 用户直接选择具体伤病，不再需要映射
 * 更新日期: 2026-01-05 (统一化后不再需要映射)
 */
export const INJURY_HISTORY_OPTIONS = ['无'] as const

/**
 * 伤病分组选项（用于前端分组显示）
 * 用户可以选择具体的伤病类型
 */
export const INJURY_HISTORY_GROUPED_OPTIONS = {
  腰部损伤: [
    { value: '下背部疼痛', name: 'lower_back_pain', description: '腰部肌肉或韧带疼痛' },
    { value: '腰椎间盘突出', name: 'herniated_disc', description: '椎间盘突出压迫神经' },
  ],
  膝盖损伤: [
    { value: '前交叉韧带损伤', name: 'acl_injury', description: 'ACL撕裂或拉伤' },
    { value: '膝盖受伤', name: 'knee_injury', description: '一般性膝盖损伤' },
    { value: '髌骨软化症', name: 'chondromalacia_patellae', description: '膝盖软骨磨损' },
    { value: '髂胫束综合征', name: 'itbs', description: 'IT带摩擦综合征' },
  ],
  肩部损伤: [
    { value: '肩峰撞击', name: 'shoulder_impingement', description: '肩峰下撞击综合征' },
    { value: '肩袖损伤', name: 'rotator_cuff_injury', description: '肩袖肌腱损伤' },
    { value: '肩部受伤', name: 'shoulder_injury', description: '一般性肩部损伤' },
  ],
  手腕损伤: [
    { value: '腕管综合征', name: 'carpal_tunnel', description: '腕管神经压迫' },
    { value: '腕部受伤', name: 'wrist_injury', description: '一般性腕部损伤' },
  ],
  脚踝损伤: [
    { value: '跟腱炎', name: 'achilles_tendinitis', description: '跟腱炎症' },
    { value: '足底筋膜炎', name: 'plantar_fasciitis', description: '足底筋膜炎症' },
    { value: '踝关节扭伤', name: 'ankle_sprain', description: '踝关节韧带损伤' },
  ],
  颈部损伤: [
    { value: '颈椎病', name: 'cervical_spondylosis', description: '颈椎退行性病变' },
    { value: '颈部受伤', name: 'neck_injury', description: '一般性颈部损伤' },
  ],
  肘部损伤: [
    { value: '网球肘', name: 'tennis_elbow', description: '肘外侧肌腱炎' },
    { value: '高尔夫球肘', name: 'golfers_elbow', description: '肘内侧肌腱炎' },
  ],
  髋部损伤: [
    { value: '髋关节撞击', name: 'hip_impingement', description: '髋关节撞击综合征' },
    { value: '髋滑囊炎', name: 'hip_bursitis', description: '髋部滑囊炎症' },
    { value: '髋部受伤', name: 'hip_injury', description: '一般性髋部损伤' },
  ],
} as const

/**
 * 所有具体伤病选项（扁平列表，用于验证）
 */
export const ALL_INJURY_OPTIONS = [
  '无',
  // 腰部损伤
  '下背部疼痛', '腰椎间盘突出',
  // 膝盖损伤
  '前交叉韧带损伤', '膝盖受伤', '髌骨软化症', '髂胫束综合征',
  // 肩部损伤
  '肩峰撞击', '肩袖损伤', '肩部受伤',
  // 手腕损伤
  '腕管综合征', '腕部受伤',
  // 脚踝损伤
  '跟腱炎', '足底筋膜炎', '踝关节扭伤',
  // 颈部损伤
  '颈椎病', '颈部受伤',
  // 肘部损伤
  '网球肘', '高尔夫球肘',
  // 髋部损伤
  '髋关节撞击', '髋滑囊炎', '髋部受伤',
  // 其他
  '其他',
] as const

/**
 * 伤病中英文对照（用于Neo4j查询）
 */
export const INJURY_NAME_MAPPING: Record<string, string> = {
  '下背部疼痛': 'lower_back_pain',
  '腰椎间盘突出': 'herniated_disc',
  '前交叉韧带损伤': 'acl_injury',
  '膝盖受伤': 'knee_injury',
  '髌骨软化症': 'chondromalacia_patellae',
  '髂胫束综合征': 'itbs',
  '肩峰撞击': 'shoulder_impingement',
  '肩袖损伤': 'rotator_cuff_injury',
  '肩部受伤': 'shoulder_injury',
  '腕管综合征': 'carpal_tunnel',
  '腕部受伤': 'wrist_injury',
  '跟腱炎': 'achilles_tendinitis',
  '足底筋膜炎': 'plantar_fasciitis',
  '踝关节扭伤': 'ankle_sprain',
  '颈椎病': 'cervical_spondylosis',
  '颈部受伤': 'neck_injury',
  '网球肘': 'tennis_elbow',
  '高尔夫球肘': 'golfers_elbow',
  '髋关节撞击': 'hip_impingement',
  '髋滑囊炎': 'hip_bursitis',
  '髋部受伤': 'hip_injury',
}
export const MEDICATION_OPTIONS = ['无', '降压药', '降糖药', '止痛药', '其他'] as const

// ==================== 体态问题选项 ====================

/**
 * 体态问题选项
 * 
 * 与Neo4j PosturalIssue节点完全对应（12个节点）
 * 更新日期: 2026-01-05
 */
export const POSTURAL_ISSUES_OPTIONS = [
  '无',
  // 上半身体态问题
  '圆肩',
  '头前伸',
  '胸椎后凸过度(驼背)',
  '胸椎后凸不足(平背)',
  // 骨盆和腰椎问题
  '骨盆前倾',
  '骨盆后倾',
  '腰椎前凸过度',
  '脊柱侧弯',
  // 下肢体态问题
  '膝内翻(O型腿)',
  '膝外翻(X型腿)',
  // 足部体态问题
  '扁平足',
  '高弓足',
] as const

/**
 * 体态问题中英文对照（用于Neo4j查询）
 */
export const POSTURAL_ISSUE_NAME_MAPPING: Record<string, string> = {
  '圆肩': 'rounded_shoulders',
  '头前伸': 'forward_head',
  '胸椎后凸过度(驼背)': 'excessive_thoracic_kyphosis',
  '胸椎后凸不足(平背)': 'flat_back',
  '骨盆前倾': 'anterior_pelvic_tilt',
  '骨盆后倾': 'posterior_pelvic_tilt',
  '腰椎前凸过度': 'excessive_lumbar_lordosis',
  '脊柱侧弯': 'scoliosis',
  '膝内翻(O型腿)': 'genu_varum',
  '膝外翻(X型腿)': 'genu_valgum',
  '扁平足': 'flat_feet',
  '高弓足': 'high_arches',
}

// ==================== 休息模式选项 ====================

export const REST_PATTERN_OPTIONS: Array<{
  value: RestPattern
  label: string
  description: string
  recommendedFor: FitnessLevel[]
}> = [
  { value: '练一休一', label: '练一休一', description: '训练1天，休息1天（适合初学者）', recommendedFor: ['beginner'] },
  { value: '练二休一', label: '练二休一', description: '训练2天，休息1天（适合新手）', recommendedFor: ['novice'] },
  { value: '练三休一', label: '练三休一', description: '训练3天，休息1天（标准模式）', recommendedFor: ['intermediate'] },
  { value: '练四休一', label: '练四休一', description: '训练4天，休息1天（适合高级）', recommendedFor: ['advanced'] },
  { value: '练五休二', label: '练五休二', description: '周一到周五训练，周末休息（上班族推荐）', recommendedFor: ['intermediate', 'advanced'] },
]

// ==================== 营养档案选项 ====================

export const POPULATION_TYPE_OPTIONS = [
  '普通人群', '增肌人群', '减脂人群', '运动员', '孕妇', '老年人', '青少年',
] as const

export const DIETARY_PREFERENCE_OPTIONS = [
  '无特殊偏好', '高蛋白', '低碳水', '低脂肪', '素食', '纯素', '生酮', '地中海饮食',
] as const

export const ALLERGY_OPTIONS = [
  '无', '花生', '牛奶', '鸡蛋', '海鲜', '坚果', '大豆', '麸质', '其他',
] as const

export const SUPPLEMENT_OPTIONS = [
  '无', '蛋白粉', '肌酸', 'BCAA', '鱼油', '维生素D', '多种维生素', '咖啡因', '其他',
] as const

export const BUDGET_OPTIONS: Array<{ value: BudgetLevel; label: string; description: string }> = [
  { value: 'low', label: '经济型', description: '每日50元以下' },
  { value: 'moderate', label: '标准型', description: '每日50-100元' },
  { value: 'high', label: '高端型', description: '每日100元以上' },
]
