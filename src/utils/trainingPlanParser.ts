/**
 * 训练计划解析工具
 * 
 * 从V2版本复刻的核心功能：
 * - parseTrainingPlanData: 从AI回复中提取训练计划JSON
 * - getMessageTextContent: 提取消息的纯文本内容
 * - formatTrainingPlanForCard: 格式化训练计划数据
 * 
 * v2.0.0更新：适配精简后的MCP数据结构
 * - 移除reasoning、safety_notes等冗余字段
 * - 动作只保留核心训练参数：exercise_id, name_zh, sets, reps_range, rest_seconds, weight
 * - 详细信息通过点击动作卡片跳转详情页查看
 * 
 * @author BUILD_BODY Team
 * @version 2.0.0
 * @created 2025-01-02
 * @updated 2025-01-02
 */

// ============ 类型定义 ============

export interface TrainingPlanExercise {
  exercise_id?: string | null
  name_zh: string
  sets: number
  reps_range: [number, number]
  rest_seconds: number
  weight?: string  // 个性化重量建议
}

export interface TrainingDay {
  day_number: number
  day_name: string
  focus_muscle_groups: string[]
  exercises: TrainingPlanExercise[]
  total_sets: number
  estimated_duration_minutes: number
}

export interface TrainingPlan {
  program_overview: {
    training_goal: string
    training_split: string
    training_days_per_week: number
    difficulty_level: string
    total_exercises: number
    total_weekly_sets: number
    estimated_weekly_duration_minutes: number
  }
  weekly_program: {
    week_number: number
    training_days: TrainingDay[]
    rest_days: number[]
    total_weekly_sets: number
    muscle_group_distribution: Record<string, number>
  }
  program_balance: {
    balance_score: number
  }
  safety_assessment: {
    overall_risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
    contraindications_found: number
    safety_recommendations: string[]
    personalized_notes: string[]  // 个性化调整说明
    medical_consultation_needed: boolean
  }
}

export interface ParsedTrainingPlanResult {
  textContent: string
  trainingPlans: TrainingPlan[]
}

// ============ 核心函数 ============

/**
 * 解析训练计划数据
 * 从消息内容中提取 [TRAINING_PLAN:{...}] 格式的数据
 * 
 * @param content - AI回复的原始内容
 * @returns 解析结果，包含纯文本内容和训练计划数组
 */
export function parseTrainingPlanData(content: string): ParsedTrainingPlanResult {
  const trainingPlans: TrainingPlan[] = []
  
  // 匹配 [TRAINING_PLAN:{...}] 格式，支持多行JSON
  const startMarker = '[TRAINING_PLAN:'
  let startIndex = content.indexOf(startMarker)
  let textContent = content
  
  while (startIndex !== -1) {
    // 找到对应的结束 }]
    const jsonStart = startIndex + startMarker.length
    let braceCount = 0
    let jsonEnd = -1
    let inString = false
    let escapeNext = false
    
    for (let i = jsonStart; i < content.length; i++) {
      const char = content[i]
      
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        continue
      }
      
      // 处理中文引号和英文引号
      if (char === '"' || char === '"' || char === '"') {
        inString = !inString
        continue
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0) {
            // 检查下一个非空白字符是否是 ]
            let nextCharIndex = i + 1
            while (nextCharIndex < content.length && /\s/.test(content[nextCharIndex])) {
              nextCharIndex++
            }
            if (content[nextCharIndex] === ']') {
              jsonEnd = nextCharIndex + 1
              break
            }
          }
        }
      }
    }
    
    if (jsonEnd !== -1) {
      const fullMatch = content.substring(startIndex, jsonEnd)
      let jsonStr = content.substring(jsonStart, jsonEnd - 1).trim()
      
      // 清理JSON字符串：替换中文引号为英文引号
      jsonStr = jsonStr
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'")
      
      try {
        const planData = JSON.parse(jsonStr)
        
        // 转换为 TrainingPlanCard 组件需要的格式
        const formattedPlan = formatTrainingPlanForCard(planData)
        trainingPlans.push(formattedPlan)
        
        // 从文本中移除训练计划JSON
        textContent = textContent.replace(fullMatch, '')
        
        console.log('[TrainingPlanParser] 成功解析训练计划:', planData.plan_name || planData.goal || '未命名计划')
      } catch (e) {
        console.error('[TrainingPlanParser] 解析训练计划JSON失败:', e, '\nJSON字符串:', jsonStr.substring(0, 200))
      }
    }
    
    // 继续查找下一个
    startIndex = content.indexOf(startMarker, jsonEnd !== -1 ? jsonEnd : startIndex + 1)
  }
  
  return { textContent: textContent.trim(), trainingPlans }
}

/**
 * 获取消息的纯文本内容（移除训练计划JSON）
 * 
 * 处理两种情况：
 * 1. 完整的 [TRAINING_PLAN:{...}] - 解析并移除
 * 2. 不完整的 [TRAINING_PLAN:... - 流式输出中，直接隐藏
 * 
 * @param content - AI回复的原始内容
 * @returns 纯文本内容
 */
export function getMessageTextContent(content: string): string {
  const { textContent } = parseTrainingPlanData(content)
  
  // 处理流式输出中不完整的训练计划标记
  // 如果还有未闭合的 [TRAINING_PLAN: 标记，说明JSON还没输出完，需要隐藏
  const incompleteMarkerIndex = textContent.indexOf('[TRAINING_PLAN:')
  if (incompleteMarkerIndex !== -1) {
    // 截取到不完整标记之前的内容
    return textContent.substring(0, incompleteMarkerIndex).trim()
  }
  
  return textContent
}

/**
 * 获取消息中的训练计划列表
 * 
 * @param content - AI回复的原始内容
 * @returns 训练计划数组
 */
export function getMessageTrainingPlans(content: string): TrainingPlan[] {
  const { trainingPlans } = parseTrainingPlanData(content)
  return trainingPlans
}

/**
 * 将智能生成的训练计划数据转换为TrainingPlanCard组件需要的格式
 * 
 * v2.2.0: 支持多种后端返回格式
 * - 格式1: MCP工具返回的标准格式 (program_overview + weekly_program)
 * - 格式2: MCP工具返回的多周格式 (program_overview + weekly_programs数组)
 * - 格式3: LLM生成的周期化计划格式 (weekly_schedule对象 + phases)
 * - 格式4: 简单数组格式 (weekly_split数组)
 * - 格式5: periodized_program_designer返回格式 (periodized_program + phases)
 * 
 * @param planData - 原始训练计划数据
 * @returns 格式化后的训练计划
 */
export function formatTrainingPlanForCard(planData: any): TrainingPlan {
  console.log('[TrainingPlanParser] 开始转换训练计划数据:', Object.keys(planData))
  
  // 格式1: 如果已经是正确格式（有program_overview和weekly_program），直接返回
  if (planData.program_overview && planData.weekly_program && planData.weekly_program.training_days) {
    console.log('[TrainingPlanParser] 数据已是标准格式，直接返回')
    return planData as TrainingPlan
  }
  
  // 格式2: MCP工具返回的多周格式 (weekly_programs数组)
  if (planData.program_overview && planData.weekly_programs && Array.isArray(planData.weekly_programs)) {
    console.log('[TrainingPlanParser] 检测到多周计划格式，使用第一周数据')
    const firstWeek = planData.weekly_programs[0]
    if (firstWeek && firstWeek.training_days) {
      return {
        program_overview: planData.program_overview,
        weekly_program: firstWeek,
        program_balance: planData.program_balance || { balance_score: 85 },
        safety_assessment: planData.safety_assessment || {
          overall_risk_level: 'LOW',
          contraindications_found: 0,
          safety_recommendations: [],
          personalized_notes: [],
          medical_consultation_needed: false
        }
      } as TrainingPlan
    }
  }
  
  // 格式5: periodized_program_designer返回格式 (periodized_program + phases)
  if (planData.periodized_program) {
    console.log('[TrainingPlanParser] 检测到periodized_program格式')
    const periodizedProgram = planData.periodized_program
    const phases = periodizedProgram.phases || []
    const weeklyPlans = periodizedProgram.weekly_plans || []
    
    // 从phases提取个性化说明
    const personalizedNotes: string[] = []
    phases.forEach((phase: any) => {
      if (phase.phase_name && phase.week_range) {
        const goals = phase.phase_goals?.join('、') || phase.key_focus || ''
        personalizedNotes.push(`${phase.phase_name}（第${phase.week_range[0]}-${phase.week_range[1]}周）：${goals}`)
      }
    })
    
    // 从execution_guidelines提取安全建议
    const safetyRecommendations = planData.execution_guidelines || []
    
    // 计算训练天数
    const trainingDaysPerWeek = weeklyPlans.length > 0 ? weeklyPlans[0].training_days : 3
    
    return {
      program_overview: {
        training_goal: planData.program_overview?.training_goal || periodizedProgram.periodization_model || '周期化训练',
        training_split: periodizedProgram.program_name || '周期化训练计划',
        training_days_per_week: trainingDaysPerWeek,
        difficulty_level: planData.program_overview?.difficulty_level || 'intermediate',
        total_exercises: 0, // 周期化计划不包含具体动作
        total_weekly_sets: weeklyPlans.length > 0 ? weeklyPlans[0].volume_sets : 0,
        estimated_weekly_duration_minutes: trainingDaysPerWeek * 60
      },
      weekly_program: {
        week_number: 1,
        training_days: [], // 周期化计划不包含具体训练日
        rest_days: [],
        total_weekly_sets: weeklyPlans.length > 0 ? weeklyPlans[0].volume_sets : 0,
        muscle_group_distribution: {}
      },
      program_balance: planData.program_balance || { balance_score: 80 },
      safety_assessment: {
        overall_risk_level: 'LOW',
        contraindications_found: 0,
        safety_recommendations: safetyRecommendations,
        personalized_notes: personalizedNotes,
        medical_consultation_needed: false
      }
    } as TrainingPlan
  }
  
  // 格式2.5: 有program_overview但weekly_program.training_days为空，尝试从weekly_programs获取
  if (planData.program_overview && planData.weekly_program && !planData.weekly_program.training_days) {
    if (planData.weekly_programs && Array.isArray(planData.weekly_programs) && planData.weekly_programs.length > 0) {
      console.log('[TrainingPlanParser] weekly_program.training_days为空，从weekly_programs获取')
      const firstWeek = planData.weekly_programs[0]
      if (firstWeek && firstWeek.training_days) {
        return {
          program_overview: planData.program_overview,
          weekly_program: firstWeek,
          program_balance: planData.program_balance || { balance_score: 85 },
          safety_assessment: planData.safety_assessment || {
            overall_risk_level: 'LOW',
            contraindications_found: 0,
            safety_recommendations: [],
            personalized_notes: [],
            medical_consultation_needed: false
          }
        } as TrainingPlan
      }
    }
  }
  
  // 转换智能生成的格式到组件需要的格式
  const exercises: TrainingPlanExercise[] = []
  const trainingDays: TrainingDay[] = []
  
  // 处理 weekly_schedule（对象格式，如 { "推日": {...}, "拉日": {...} }）
  const weeklySchedule = planData.weekly_schedule
  if (weeklySchedule && typeof weeklySchedule === 'object' && !Array.isArray(weeklySchedule)) {
    console.log('[TrainingPlanParser] 检测到weekly_schedule对象格式')
    
    let dayIndex = 0
    for (const [dayName, dayData] of Object.entries(weeklySchedule)) {
      const day = dayData as any
      const dayExercises: TrainingPlanExercise[] = (day.exercises || []).map((ex: any) => ({
        exercise_id: ex.exercise_id || ex.id || null,
        name_zh: ex.name_zh || ex.name || ex.exercise_name || '未知动作',
        sets: parseInt(ex.sets) || 3,
        reps_range: ex.reps_range || parseRepsRange(ex.reps),
        rest_seconds: ex.rest_seconds || parseRestSeconds(ex.rest),
        weight: ex.weight || ex.intensity || undefined
      }))
      
      trainingDays.push({
        day_number: dayIndex + 1,
        day_name: dayName,
        focus_muscle_groups: day.primary_muscles || day.focus_muscle_groups || [dayName],
        exercises: dayExercises,
        total_sets: dayExercises.reduce((sum: number, ex: TrainingPlanExercise) => sum + ex.sets, 0),
        estimated_duration_minutes: dayExercises.length * 8
      })
      
      exercises.push(...dayExercises)
      dayIndex++
    }
  }
  // 处理 weekly_split 或 weekly_schedule 数组格式
  else {
    const schedule = planData.weekly_split || planData.weekly_schedule || []
    
    if (Array.isArray(schedule)) {
      console.log('[TrainingPlanParser] 检测到数组格式，共', schedule.length, '天')
      
      schedule.forEach((day: any, index: number) => {
        const dayExercises: TrainingPlanExercise[] = (day.exercises || []).map((ex: any) => ({
          exercise_id: ex.exercise_id || ex.id || null,
          name_zh: ex.name_zh || ex.name || ex.exercise_name || '未知动作',
          sets: parseInt(ex.sets) || 3,
          reps_range: ex.reps_range || parseRepsRange(ex.reps),
          rest_seconds: ex.rest_seconds || parseRestSeconds(ex.rest),
          weight: ex.weight || ex.intensity || undefined
        }))
        
        trainingDays.push({
          day_number: index + 1,
          day_name: day.day || day.day_name || `第${index + 1}天`,
          focus_muscle_groups: day.primary_muscles || day.focus_muscle_groups || [day.focus || '综合训练'],
          exercises: dayExercises,
          total_sets: dayExercises.reduce((sum: number, ex: TrainingPlanExercise) => sum + ex.sets, 0),
          estimated_duration_minutes: dayExercises.length * 8
        })
        
        exercises.push(...dayExercises)
      })
    }
  }
  
  // 提取安全建议
  const safetyRecommendations: string[] = []
  if (planData.special_notes && Array.isArray(planData.special_notes)) {
    safetyRecommendations.push(...planData.special_notes)
  }
  if (planData.notes) {
    safetyRecommendations.push(planData.notes)
  }
  
  // 提取周期化信息作为个性化说明
  const personalizedNotes: string[] = []
  if (planData.phases && Array.isArray(planData.phases)) {
    planData.phases.forEach((phase: any) => {
      if (phase.phase_name && phase.week_range) {
        personalizedNotes.push(`${phase.phase_name}（第${phase.week_range[0]}-${phase.week_range[1]}周）：${phase.phase_goals?.join('、') || ''}`)
      }
    })
  }
  if (planData.progression_rules && Array.isArray(planData.progression_rules)) {
    personalizedNotes.push(...planData.progression_rules.slice(0, 2))
  }
  
  // 确定训练目标
  const trainingGoal = planData.training_goal || planData.primary_goal || planData.goal || '综合健身'
  const trainingGoalMap: Record<string, string> = {
    'hypertrophy': '增肌',
    'strength': '力量提升',
    'fat_loss': '减脂',
    'endurance': '耐力',
    'general_fitness': '综合健身'
  }
  
  // 确定难度等级
  const difficultyLevel = planData.difficulty_level || 
    (planData.periodization_model === 'linear' ? 'intermediate' : 'beginner')
  
  const result: TrainingPlan = {
    program_overview: {
      training_goal: trainingGoalMap[trainingGoal] || trainingGoal,
      training_split: planData.program_name || planData.split_type || planData.plan_name || '训练计划',
      training_days_per_week: planData.training_days_per_week || trainingDays.length,
      difficulty_level: difficultyLevel,
      total_exercises: exercises.length,
      total_weekly_sets: exercises.reduce((sum: number, ex: TrainingPlanExercise) => sum + ex.sets, 0),
      estimated_weekly_duration_minutes: trainingDays.reduce((sum: number, day: TrainingDay) => sum + day.estimated_duration_minutes, 0)
    },
    weekly_program: {
      week_number: 1,
      training_days: trainingDays,
      rest_days: [],
      total_weekly_sets: exercises.reduce((sum: number, ex: TrainingPlanExercise) => sum + ex.sets, 0),
      muscle_group_distribution: {}
    },
    program_balance: {
      balance_score: 85
    },
    safety_assessment: {
      overall_risk_level: 'LOW',
      contraindications_found: 0,
      safety_recommendations: safetyRecommendations,
      personalized_notes: personalizedNotes,
      medical_consultation_needed: false
    }
  }
  
  console.log('[TrainingPlanParser] 转换完成:', {
    trainingDays: trainingDays.length,
    totalExercises: exercises.length,
    totalSets: result.program_overview.total_weekly_sets
  })
  
  return result
}

// ============ 辅助函数 ============

/**
 * 解析次数范围字符串
 * 
 * @param reps - 次数字符串，如 "10-12" 或 "力竭"
 * @returns 次数范围元组 [min, max]
 */
export function parseRepsRange(reps: string | undefined): [number, number] {
  if (!reps) return [8, 12]
  
  // 处理 "10-12" 格式
  const rangeMatch = reps.match(/(\d+)\s*[-~]\s*(\d+)/)
  if (rangeMatch) {
    return [parseInt(rangeMatch[1]), parseInt(rangeMatch[2])]
  }
  
  // 处理 "力竭" 或纯数字
  const numMatch = reps.match(/(\d+)/)
  if (numMatch) {
    const num = parseInt(numMatch[1])
    return [num, num]
  }
  
  return [8, 12]
}

/**
 * 解析休息时间字符串
 * 
 * @param rest - 休息时间字符串，如 "60秒" 或 "1-2分钟"
 * @returns 休息时间（秒）
 */
export function parseRestSeconds(rest: string | undefined): number {
  if (!rest) return 60
  
  // 处理 "60秒" 格式
  const secondsMatch = rest.match(/(\d+)\s*秒/)
  if (secondsMatch) {
    return parseInt(secondsMatch[1])
  }
  
  // 处理 "1分钟" 或 "1-2分钟" 格式
  const minutesMatch = rest.match(/(\d+)(?:\s*[-~]\s*\d+)?\s*分/)
  if (minutesMatch) {
    return parseInt(minutesMatch[1]) * 60
  }
  
  // 处理纯数字
  const numMatch = rest.match(/(\d+)/)
  if (numMatch) {
    const num = parseInt(numMatch[1])
    // 如果数字小于10，假设是分钟
    return num < 10 ? num * 60 : num
  }
  
  return 60
}

/**
 * 增强文本渲染，添加动作链接
 * 基于MCO工具返回的exercise_id和detail_url生成链接
 *
 * 注意：此函数现在只做标记处理，实际的链接替换在MessageItem组件中完成
 * 
 * @param text - 原始文本
 * @returns 处理后的文本
 */
export function enhanceTextWithExerciseLinks(text: string): string {
  // 不再进行硬编码映射，只标记需要处理的文本
  // 实际的动作链接将由MCO工具的tool_results提供
  return text
}
