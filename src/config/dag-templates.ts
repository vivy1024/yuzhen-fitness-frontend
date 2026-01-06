/**
 * DAG模板配置
 * 定义13个AI场景模板的前端展示信息
 * 
 * MVP阶段：按复杂度分级计费
 * - 简单场景(complexity 1): 成本低，次数多
 * - 中等场景(complexity 2): 成本中等
 * - 复杂场景(complexity 3): 成本高，次数少
 * 
 * @author 玉珍健身 v3.0
 * @created 2026-01-06
 */

export interface DAGTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'quick' | 'training' | 'nutrition' | 'safety' | 'comprehensive'
  complexity: 1 | 2 | 3
  toolCount: number
  membershipRequired: 'free' | 'warmheart' | 'energy'
  quickPrompts: string[]
}

/**
 * 复杂度分级说明
 * - simple (complexity 1): 问候、快速咨询、动作优化 - 成本~¥0.02/次
 * - medium (complexity 2): 进展分析、安全评估、营养规划等 - 成本~¥0.04/次
 * - complex (complexity 3): 完整计划、综合方案、康复训练等 - 成本~¥0.10/次
 */
export const COMPLEXITY_CATEGORIES = {
  simple: ['greeting', 'quick_consultation', 'exercise_optimization'],
  medium: ['progress_analysis', 'safety_assessment', 'nutrition_planning', 'posture_correction', 'plan_adjustment'],
  complex: ['complete_training_plan', 'comprehensive_fitness', 'rehabilitation_training', 'fat_loss_program', 'strength_program']
} as const

/**
 * 按复杂度的每日使用限制
 */
export const COMPLEXITY_LIMITS = {
  free: { simple: 5, medium: 2, complex: 1 },
  warmheart: { simple: 10, medium: 5, complex: 2 },
  energy: { simple: -1, medium: -1, complex: -1 } // -1表示无限制
} as const

/**
 * DAG模板分级（MVP阶段 - 按复杂度分级计费）
 * 所有会员都可以使用全部13个模板，但按复杂度限制次数
 */
export const DAG_TEMPLATE_TIERS = {
  free: [
    'greeting', 'quick_consultation', 'exercise_optimization', 
    'progress_analysis', 'safety_assessment', 'complete_training_plan', 
    'nutrition_planning', 'comprehensive_fitness', 'rehabilitation_training', 
    'posture_correction', 'plan_adjustment', 'fat_loss_program', 'strength_program'
  ],
  warmheart: [
    'greeting', 'quick_consultation', 'exercise_optimization', 
    'progress_analysis', 'safety_assessment', 'complete_training_plan', 
    'nutrition_planning', 'comprehensive_fitness', 'rehabilitation_training', 
    'posture_correction', 'plan_adjustment', 'fat_loss_program', 'strength_program'
  ],
  energy: [
    'greeting', 'quick_consultation', 'exercise_optimization', 
    'progress_analysis', 'safety_assessment', 'complete_training_plan', 
    'nutrition_planning', 'comprehensive_fitness', 'rehabilitation_training', 
    'posture_correction', 'plan_adjustment', 'fat_loss_program', 'strength_program'
  ]
} as const

/**
 * 13个DAG模板定义
 * MVP阶段：免费版开放全部模板
 */
export const DAG_TEMPLATES: Record<string, DAGTemplate> = {
  // 全部模板免费开放
  greeting: {
    id: 'greeting',
    name: '问候闲聊',
    description: '友好回应问候和简单闲聊',
    icon: '👋',
    category: 'quick',
    complexity: 1,
    toolCount: 0,
    membershipRequired: 'free',
    quickPrompts: ['你好', '早上好', '今天怎么样']
  },
  quick_consultation: {
    id: 'quick_consultation',
    name: '快速咨询',
    description: '快速回答简单的健身问题',
    icon: '💬',
    category: 'quick',
    complexity: 1,
    toolCount: 1,
    membershipRequired: 'free',
    quickPrompts: ['健身小白怎么开始', '一周练几次合适', '什么时候锻炼最好']
  },
  exercise_optimization: {
    id: 'exercise_optimization',
    name: '动作优化',
    description: '优化训练动作选择，提供替代方案',
    icon: '🎯',
    category: 'training',
    complexity: 1,
    toolCount: 3,
    membershipRequired: 'free',
    quickPrompts: ['推荐胸部训练动作', '卧推的替代动作', '适合新手的背部动作']
  },
  progress_analysis: {
    id: 'progress_analysis',
    name: '进展分析',
    description: '分析训练进展，提供优化建议',
    icon: '📊',
    category: 'training',
    complexity: 2,
    toolCount: 2,
    membershipRequired: 'free',
    quickPrompts: ['分析我的训练进展', '训练量是否合适', '如何突破瓶颈']
  },
  safety_assessment: {
    id: 'safety_assessment',
    name: '安全评估',
    description: '评估运动安全性，识别风险和禁忌',
    icon: '🛡️',
    category: 'safety',
    complexity: 2,
    toolCount: 3,
    membershipRequired: 'free',
    quickPrompts: ['我有腰椎间盘突出能练什么', '膝盖不好怎么练腿', '高血压能做力量训练吗']
  },
  complete_training_plan: {
    id: 'complete_training_plan',
    name: '完整训练计划',
    description: '制定包含动作选择、训练量、周期化的完整计划',
    icon: '📋',
    category: 'comprehensive',
    complexity: 3,
    toolCount: 7,
    membershipRequired: 'free',
    quickPrompts: ['帮我制定增肌计划', '一周三练的训练计划', '新手力量训练计划']
  },
  nutrition_planning: {
    id: 'nutrition_planning',
    name: '营养规划',
    description: '基于目标制定完整的营养方案',
    icon: '🥗',
    category: 'nutrition',
    complexity: 2,
    toolCount: 4,
    membershipRequired: 'free',
    quickPrompts: ['增肌期怎么吃', '减脂饮食计划', '计算我的TDEE']
  },
  comprehensive_fitness: {
    id: 'comprehensive_fitness',
    name: '综合健身方案',
    description: '训练+营养+安全的完整解决方案',
    icon: '🏆',
    category: 'comprehensive',
    complexity: 3,
    toolCount: 8,
    membershipRequired: 'free',
    quickPrompts: ['给我一个完整的健身方案', '系统的增肌计划和饮食', '全面的减脂方案']
  },
  rehabilitation_training: {
    id: 'rehabilitation_training',
    name: '康复训练',
    description: '为有伤病史的用户制定安全康复计划',
    icon: '🏥',
    category: 'safety',
    complexity: 3,
    toolCount: 4,
    membershipRequired: 'free',
    quickPrompts: ['肩膀受伤后怎么恢复训练', '膝盖术后康复训练', '腰伤康复计划']
  },
  posture_correction: {
    id: 'posture_correction',
    name: '体态矫正',
    description: '评估体态问题，推荐矫正训练',
    icon: '🧘',
    category: 'safety',
    complexity: 2,
    toolCount: 4,
    membershipRequired: 'free',
    quickPrompts: ['圆肩驼背怎么矫正', '骨盆前倾怎么改善', '体态评估和矫正方案']
  },
  plan_adjustment: {
    id: 'plan_adjustment',
    name: '计划调整',
    description: '根据反馈调整现有训练计划',
    icon: '🔄',
    category: 'training',
    complexity: 2,
    toolCount: 3,
    membershipRequired: 'free',
    quickPrompts: ['训练计划需要调整', '换几个动作', '增加训练量']
  },
  fat_loss_program: {
    id: 'fat_loss_program',
    name: '减脂专项',
    description: '以减脂为目标的训练和营养方案',
    icon: '🔥',
    category: 'comprehensive',
    complexity: 3,
    toolCount: 6,
    membershipRequired: 'free',
    quickPrompts: ['减脂训练计划', '如何科学减肥', '减脂期训练和饮食']
  },
  strength_program: {
    id: 'strength_program',
    name: '力量专项',
    description: '以增强力量为目标的专项训练',
    icon: '💪',
    category: 'training',
    complexity: 3,
    toolCount: 4,
    membershipRequired: 'free',
    quickPrompts: ['提高卧推力量', '力量训练计划', '如何突破深蹲重量']
  }
}

/**
 * 获取用户可用的模板列表
 */
export function getAvailableTemplates(membershipTier: 'free' | 'warmheart' | 'energy'): DAGTemplate[] {
  const availableIds: string[] = []
  
  // 免费模板所有人可用
  availableIds.push(...DAG_TEMPLATE_TIERS.free)
  
  // 暖心会员及以上
  if (membershipTier === 'warmheart' || membershipTier === 'energy') {
    availableIds.push(...DAG_TEMPLATE_TIERS.warmheart)
  }
  
  // 能量会员
  if (membershipTier === 'energy') {
    availableIds.push(...DAG_TEMPLATE_TIERS.energy)
  }
  
  return availableIds.map(id => DAG_TEMPLATES[id]).filter(Boolean)
}

/**
 * 检查模板是否可用
 */
export function isTemplateAvailable(templateId: string, membershipTier: 'free' | 'warmheart' | 'energy'): boolean {
  const template = DAG_TEMPLATES[templateId]
  if (!template) return false
  
  if (template.membershipRequired === 'free') return true
  if (template.membershipRequired === 'warmheart' && (membershipTier === 'warmheart' || membershipTier === 'energy')) return true
  if (template.membershipRequired === 'energy' && membershipTier === 'energy') return true
  
  return false
}

/**
 * 获取模板的会员要求显示文本
 */
export function getMembershipRequiredText(membershipRequired: 'free' | 'warmheart' | 'energy'): string {
  const texts = {
    free: '免费',
    warmheart: '暖心会员',
    energy: '能量会员'
  }
  return texts[membershipRequired]
}

/**
 * 按类别分组模板
 */
export function getTemplatesByCategory(): Record<string, DAGTemplate[]> {
  const categories: Record<string, DAGTemplate[]> = {
    quick: [],
    training: [],
    nutrition: [],
    safety: [],
    comprehensive: []
  }
  
  Object.values(DAG_TEMPLATES).forEach(template => {
    categories[template.category].push(template)
  })
  
  return categories
}

/**
 * 类别显示名称
 */
export const CATEGORY_NAMES: Record<string, string> = {
  quick: '快速咨询',
  training: '训练指导',
  nutrition: '营养规划',
  safety: '安全评估',
  comprehensive: '综合方案'
}

/**
 * 获取模板的复杂度级别
 */
export function getTemplateComplexity(templateId: string): 'simple' | 'medium' | 'complex' {
  if (COMPLEXITY_CATEGORIES.simple.includes(templateId as any)) return 'simple'
  if (COMPLEXITY_CATEGORIES.medium.includes(templateId as any)) return 'medium'
  return 'complex'
}

/**
 * 获取复杂度的中文名称
 */
export function getComplexityName(complexity: 'simple' | 'medium' | 'complex'): string {
  const names = {
    simple: '简单',
    medium: '中等',
    complex: '复杂'
  }
  return names[complexity]
}

/**
 * 获取用户对特定复杂度的每日限制
 */
export function getComplexityLimit(
  membershipTier: 'free' | 'warmheart' | 'energy',
  complexity: 'simple' | 'medium' | 'complex'
): number {
  return COMPLEXITY_LIMITS[membershipTier][complexity]
}

/**
 * 获取用户所有复杂度的限制
 */
export function getAllComplexityLimits(membershipTier: 'free' | 'warmheart' | 'energy') {
  return COMPLEXITY_LIMITS[membershipTier]
}

/**
 * 按复杂度分组模板
 */
export function getTemplatesByComplexity(): Record<'simple' | 'medium' | 'complex', DAGTemplate[]> {
  return {
    simple: COMPLEXITY_CATEGORIES.simple.map(id => DAG_TEMPLATES[id]).filter(Boolean),
    medium: COMPLEXITY_CATEGORIES.medium.map(id => DAG_TEMPLATES[id]).filter(Boolean),
    complex: COMPLEXITY_CATEGORIES.complex.map(id => DAG_TEMPLATES[id]).filter(Boolean)
  }
}
