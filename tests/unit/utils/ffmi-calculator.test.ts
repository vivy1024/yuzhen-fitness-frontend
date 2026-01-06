/**
 * FFMI计算器单元测试
 * 
 * 测试BMI/FFMI计算、评估等级判断、训练建议生成
 * 
 * @module tests/unit/utils/ffmi-calculator
 */

import { describe, it, expect } from 'vitest'
import { calculateFFMI } from '@/utils/ffmi-calculator'

describe('FFMI Calculator', () => {
  describe('BMI计算', () => {
    it('应该正确计算BMI - 正常体重', () => {
      const result = calculateFFMI({
        height: 175,
        weight: 70,
        gender: 'male'
      })
      // BMI = 70 / (1.75 * 1.75) = 22.86
      expect(result.bmi).toBeCloseTo(22.9, 1)
      expect(result.bmi_status).toBe('normal')
    })

    it('应该正确计算BMI - 偏瘦', () => {
      const result = calculateFFMI({
        height: 180,
        weight: 55,
        gender: 'male'
      })
      // BMI = 55 / (1.8 * 1.8) = 16.98
      expect(result.bmi).toBeLessThan(18.5)
      expect(result.bmi_status).toBe('underweight')
    })

    it('应该正确计算BMI - 超重', () => {
      const result = calculateFFMI({
        height: 175,
        weight: 80,
        gender: 'male'
      })
      // BMI = 80 / (1.75 * 1.75) = 26.12
      expect(result.bmi).toBeGreaterThan(24)
      expect(result.bmi).toBeLessThan(28)
      expect(result.bmi_status).toBe('overweight')
    })

    it('应该正确计算BMI - 肥胖', () => {
      const result = calculateFFMI({
        height: 165,
        weight: 90,
        gender: 'female'
      })
      // BMI = 90 / (1.65 * 1.65) = 33.06
      expect(result.bmi).toBeGreaterThan(28)
      expect(result.bmi_status).toBe('obese')
    })
  })

  describe('FFMI计算', () => {
    it('应该正确计算FFMI - 提供体脂率', () => {
      const result = calculateFFMI({
        height: 180,
        weight: 80,
        bodyFat: 15,
        gender: 'male'
      })
      // 瘦体重 = 80 * (1 - 0.15) = 68
      // FFMI = 68 / (1.8 * 1.8) = 20.99
      expect(result.lean_body_mass).toBeCloseTo(68, 0)
      expect(result.ffmi).toBeCloseTo(21, 0)
      expect(result.used_estimated_bf).toBe(false)
    })

    it('应该正确计算FFMI - 估算体脂率', () => {
      const result = calculateFFMI({
        height: 175,
        weight: 75,
        gender: 'male'
      })
      expect(result.used_estimated_bf).toBe(true)
      expect(result.ffmi).toBeGreaterThan(0)
    })

    it('应该正确计算标准化FFMI', () => {
      const result = calculateFFMI({
        height: 180,
        weight: 80,
        bodyFat: 15,
        gender: 'male'
      })
      // 标准化FFMI = FFMI + 6.1 * (1.8 - height_m)
      // 身高1.8m时，标准化FFMI = FFMI
      expect(result.normalized_ffmi).toBeCloseTo(result.ffmi, 0)
    })

    it('应该对较矮身高进行标准化调整', () => {
      const result = calculateFFMI({
        height: 170,
        weight: 70,
        bodyFat: 15,
        gender: 'male'
      })
      // 身高1.7m时，标准化FFMI > FFMI
      expect(result.normalized_ffmi).toBeGreaterThan(result.ffmi)
    })
  })

  describe('FFMI评估等级', () => {
    it('应该正确评估男性FFMI等级 - 一般', () => {
      const result = calculateFFMI({
        height: 175,
        weight: 65,
        bodyFat: 15,
        gender: 'male'
      })
      expect(['偏低', '一般', '良好']).toContain(result.assessment)
    })

    it('应该正确评估男性FFMI等级 - 优秀', () => {
      const result = calculateFFMI({
        height: 180,
        weight: 90,
        bodyFat: 12,
        gender: 'male'
      })
      // 瘦体重 = 90 * 0.88 = 79.2
      // FFMI = 79.2 / 3.24 = 24.44
      expect(['优秀', '很好', '极佳']).toContain(result.assessment)
    })

    it('应该正确评估女性FFMI等级', () => {
      const result = calculateFFMI({
        height: 165,
        weight: 55,
        bodyFat: 22,
        gender: 'female'
      })
      expect(result.assessment).toBeDefined()
      expect(typeof result.assessment).toBe('string')
    })
  })

  describe('训练建议', () => {
    it('应该为偏瘦用户推荐增肌增重', () => {
      const result = calculateFFMI({
        height: 180,
        weight: 55,
        gender: 'male'
      })
      expect(result.training_recommendation.focus).toBe('增肌增重')
      expect(result.training_recommendation.suggestions.length).toBeGreaterThan(0)
    })

    it('应该为肥胖用户推荐减脂保肌', () => {
      const result = calculateFFMI({
        height: 170,
        weight: 95,
        gender: 'male'
      })
      expect(result.training_recommendation.focus).toBe('减脂保肌')
    })

    it('应该为正常体重用户提供合适建议', () => {
      const result = calculateFFMI({
        height: 175,
        weight: 70,
        bodyFat: 15,
        gender: 'male'
      })
      expect(['增肌为主', '维持优化']).toContain(result.training_recommendation.focus)
    })
  })

  describe('自然潜力评估', () => {
    it('应该正确评估自然潜力', () => {
      const result = calculateFFMI({
        height: 180,
        weight: 80,
        bodyFat: 15,
        gender: 'male'
      })
      expect(result.natural_potential).toBeDefined()
      expect(typeof result.natural_potential).toBe('string')
    })
  })

  describe('返回值完整性', () => {
    it('应该返回所有必需字段', () => {
      const result = calculateFFMI({
        height: 175,
        weight: 70,
        gender: 'male'
      })
      
      expect(result).toHaveProperty('bmi')
      expect(result).toHaveProperty('bmi_status')
      expect(result).toHaveProperty('lean_body_mass')
      expect(result).toHaveProperty('ffmi')
      expect(result).toHaveProperty('normalized_ffmi')
      expect(result).toHaveProperty('assessment')
      expect(result).toHaveProperty('natural_potential')
      expect(result).toHaveProperty('training_recommendation')
      expect(result).toHaveProperty('used_estimated_bf')
      expect(result).toHaveProperty('calculated_at')
    })

    it('应该返回有效的ISO日期字符串', () => {
      const result = calculateFFMI({
        height: 175,
        weight: 70,
        gender: 'male'
      })
      expect(() => new Date(result.calculated_at)).not.toThrow()
    })
  })
})
