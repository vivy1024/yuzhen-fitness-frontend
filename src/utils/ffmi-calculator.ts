/**
 * FFMI (Fat-Free Mass Index) 计算器
 * 无脂肪质量指数计算工具
 */

import type { FFMIAssessment, BMIStatus, Gender } from '@/types/user-profile'

interface FFMIInput {
  height: number // cm
  weight: number // kg
  bodyFat?: number // %
  gender: Gender
}

/**
 * 根据性别估算体脂率
 */
function estimateBodyFat(bmi: number, gender: Gender): number {
  // 使用简化的体脂率估算公式
  if (gender === 'male') {
    return Math.max(5, Math.min(40, (1.20 * bmi) - 10.8 - 5.4))
  } else {
    return Math.max(10, Math.min(45, (1.20 * bmi) - 10.8 + 5.4))
  }
}

/**
 * 获取BMI状态
 */
function getBMIStatus(bmi: number): BMIStatus {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 24) return 'normal'
  if (bmi < 28) return 'overweight'
  return 'obese'
}

/**
 * 获取FFMI评估等级
 */
function getFFMIAssessment(ffmi: number, gender: Gender): string {
  const thresholds = gender === 'male'
    ? { low: 17, average: 19, good: 21, excellent: 23, elite: 25, suspicious: 27 }
    : { low: 14, average: 16, good: 18, excellent: 20, elite: 22, suspicious: 24 }

  if (ffmi < thresholds.low) return '偏低'
  if (ffmi < thresholds.average) return '一般'
  if (ffmi < thresholds.good) return '良好'
  if (ffmi < thresholds.excellent) return '优秀'
  if (ffmi < thresholds.elite) return '很好'
  if (ffmi < thresholds.suspicious) return '极佳'
  return '疑似使用增强剂'
}

/**
 * 获取自然潜力评估
 */
function getNaturalPotential(ffmi: number, gender: Gender): string {
  const limit = gender === 'male' ? 25 : 22
  const percentage = (ffmi / limit) * 100

  if (percentage < 60) return '还有很大提升空间'
  if (percentage < 75) return '有较大提升空间'
  if (percentage < 85) return '有一定提升空间'
  if (percentage < 95) return '接近自然极限'
  return '已达到或超过自然极限'
}

/**
 * 获取训练建议
 */
function getTrainingRecommendation(ffmi: number, bmi: number, gender: Gender): { focus: string; suggestions: string[] } {
  const limit = gender === 'male' ? 25 : 22
  const percentage = (ffmi / limit) * 100

  if (bmi < 18.5) {
    return {
      focus: '增肌增重',
      suggestions: [
        '增加热量摄入，每日热量盈余300-500kcal',
        '保证充足蛋白质摄入（1.6-2.2g/kg体重）',
        '以复合动作为主，逐步增加训练重量',
        '保证充足睡眠和恢复时间',
      ],
    }
  }

  if (bmi > 28) {
    return {
      focus: '减脂保肌',
      suggestions: [
        '适度热量缺口，每日减少300-500kcal',
        '保持高蛋白摄入防止肌肉流失',
        '结合力量训练和有氧运动',
        '注意训练强度，避免过度疲劳',
      ],
    }
  }

  if (percentage < 70) {
    return {
      focus: '增肌为主',
      suggestions: [
        '专注于渐进式超负荷训练',
        '保证充足蛋白质摄入',
        '合理安排训练和休息',
        '可以适当增加训练频率',
      ],
    }
  }

  return {
    focus: '维持优化',
    suggestions: [
      '保持当前训练强度',
      '注重训练质量而非数量',
      '关注薄弱肌群的发展',
      '定期调整训练计划避免平台期',
    ],
  }
}

/**
 * 计算FFMI
 */
export function calculateFFMI(input: FFMIInput): FFMIAssessment {
  const { height, weight, bodyFat, gender } = input
  const heightInMeters = height / 100

  // 计算BMI
  const bmi = weight / (heightInMeters * heightInMeters)
  const bmiStatus = getBMIStatus(bmi)

  // 确定体脂率
  const usedEstimatedBf = !bodyFat
  const actualBodyFat = bodyFat || estimateBodyFat(bmi, gender)

  // 计算瘦体重 (Lean Body Mass)
  const leanBodyMass = weight * (1 - actualBodyFat / 100)

  // 计算FFMI
  const ffmi = leanBodyMass / (heightInMeters * heightInMeters)

  // 计算标准化FFMI（调整到1.8米身高）
  const normalizedFFMI = ffmi + 6.1 * (1.8 - heightInMeters)

  // 获取评估结果
  const assessment = getFFMIAssessment(normalizedFFMI, gender)
  const naturalPotential = getNaturalPotential(normalizedFFMI, gender)
  const trainingRecommendation = getTrainingRecommendation(normalizedFFMI, bmi, gender)

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmi_status: bmiStatus,
    lean_body_mass: Math.round(leanBodyMass * 10) / 10,
    ffmi: Math.round(ffmi * 10) / 10,
    normalized_ffmi: Math.round(normalizedFFMI * 10) / 10,
    assessment,
    natural_potential: naturalPotential,
    training_recommendation: trainingRecommendation,
    used_estimated_bf: usedEstimatedBf,
    calculated_at: new Date().toISOString(),
  }
}
