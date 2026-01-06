/**
 * 训练计划解析器单元测试
 * 
 * 测试训练计划JSON解析、文本提取、格式转换
 * 
 * @module tests/unit/utils/trainingPlanParser
 */

import { describe, it, expect } from 'vitest'
import {
  parseTrainingPlanData,
  getMessageTextContent,
  getMessageTrainingPlans,
  formatTrainingPlanForCard,
  parseRepsRange,
  parseRestSeconds
} from '@/utils/trainingPlanParser'

describe('Training Plan Parser', () => {
  describe('parseRepsRange', () => {
    it('应该正确解析范围格式 "10-12"', () => {
      expect(parseRepsRange('10-12')).toEqual([10, 12])
    })

    it('应该正确解析范围格式 "8~10"', () => {
      expect(parseRepsRange('8~10')).toEqual([8, 10])
    })

    it('应该正确解析单个数字', () => {
      expect(parseRepsRange('15')).toEqual([15, 15])
    })

    it('应该返回默认值 - undefined输入', () => {
      expect(parseRepsRange(undefined)).toEqual([8, 12])
    })

    it('应该返回默认值 - 无法解析的字符串', () => {
      expect(parseRepsRange('力竭')).toEqual([8, 12])
    })
  })

  describe('parseRestSeconds', () => {
    it('应该正确解析秒格式 "60秒"', () => {
      expect(parseRestSeconds('60秒')).toBe(60)
    })

    it('应该正确解析秒格式 "90秒"', () => {
      expect(parseRestSeconds('90秒')).toBe(90)
    })

    it('应该正确解析分钟格式 "2分钟"', () => {
      expect(parseRestSeconds('2分钟')).toBe(120)
    })

    it('应该正确解析范围分钟格式 "1-2分钟"', () => {
      expect(parseRestSeconds('1-2分钟')).toBe(60)
    })

    it('应该正确解析纯数字 - 小于10假设为分钟', () => {
      expect(parseRestSeconds('2')).toBe(120)
    })

    it('应该正确解析纯数字 - 大于等于10假设为秒', () => {
      expect(parseRestSeconds('90')).toBe(90)
    })

    it('应该返回默认值 - undefined输入', () => {
      expect(parseRestSeconds(undefined)).toBe(60)
    })
  })

  describe('parseTrainingPlanData', () => {
    it('应该正确解析包含训练计划的消息', () => {
      const content = `这是您的训练计划：
[TRAINING_PLAN:{"program_overview":{"training_goal":"增肌","training_split":"推拉腿","training_days_per_week":3,"difficulty_level":"intermediate","total_exercises":9,"total_weekly_sets":27,"estimated_weekly_duration_minutes":180},"weekly_program":{"week_number":1,"training_days":[{"day_number":1,"day_name":"推日","focus_muscle_groups":["胸","肩","三头"],"exercises":[{"name_zh":"杠铃卧推","sets":3,"reps_range":[8,12],"rest_seconds":90}],"total_sets":3,"estimated_duration_minutes":60}],"rest_days":[4,7],"total_weekly_sets":27,"muscle_group_distribution":{}},"program_balance":{"balance_score":85},"safety_assessment":{"overall_risk_level":"LOW","contraindications_found":0,"safety_recommendations":[],"personalized_notes":[],"medical_consultation_needed":false}}]
祝您训练愉快！`

      const result = parseTrainingPlanData(content)
      
      expect(result.trainingPlans.length).toBe(1)
      expect(result.trainingPlans[0].program_overview.training_goal).toBe('增肌')
      expect(result.textContent).toContain('这是您的训练计划')
      expect(result.textContent).toContain('祝您训练愉快')
      expect(result.textContent).not.toContain('TRAINING_PLAN')
    })

    it('应该返回空数组 - 无训练计划', () => {
      const content = '这是一条普通消息，没有训练计划。'
      
      const result = parseTrainingPlanData(content)
      
      expect(result.trainingPlans.length).toBe(0)
      expect(result.textContent).toBe(content)
    })

    it('应该处理多个训练计划', () => {
      const plan1 = '{"program_overview":{"training_goal":"增肌"},"weekly_program":{"week_number":1,"training_days":[]},"program_balance":{"balance_score":80},"safety_assessment":{"overall_risk_level":"LOW","contraindications_found":0,"safety_recommendations":[],"personalized_notes":[],"medical_consultation_needed":false}}'
      const plan2 = '{"program_overview":{"training_goal":"减脂"},"weekly_program":{"week_number":1,"training_days":[]},"program_balance":{"balance_score":85},"safety_assessment":{"overall_risk_level":"LOW","contraindications_found":0,"safety_recommendations":[],"personalized_notes":[],"medical_consultation_needed":false}}'
      const content = `计划1：[TRAINING_PLAN:${plan1}] 计划2：[TRAINING_PLAN:${plan2}]`
      
      const result = parseTrainingPlanData(content)
      
      expect(result.trainingPlans.length).toBe(2)
    })
  })

  describe('getMessageTextContent', () => {
    it('应该移除训练计划JSON返回纯文本', () => {
      const content = `您好！[TRAINING_PLAN:{"program_overview":{"training_goal":"增肌"},"weekly_program":{"week_number":1,"training_days":[]},"program_balance":{"balance_score":80},"safety_assessment":{"overall_risk_level":"LOW","contraindications_found":0,"safety_recommendations":[],"personalized_notes":[],"medical_consultation_needed":false}}]再见！`
      
      const result = getMessageTextContent(content)
      
      expect(result).toContain('您好')
      expect(result).toContain('再见')
      expect(result).not.toContain('TRAINING_PLAN')
    })

    it('应该处理不完整的训练计划标记（流式输出）', () => {
      const content = '正在生成训练计划...[TRAINING_PLAN:{"program_overview":'
      
      const result = getMessageTextContent(content)
      
      expect(result).toBe('正在生成训练计划...')
    })

    it('应该返回原文本 - 无训练计划', () => {
      const content = '这是普通消息'
      
      expect(getMessageTextContent(content)).toBe(content)
    })
  })

  describe('getMessageTrainingPlans', () => {
    it('应该返回训练计划数组', () => {
      const content = `[TRAINING_PLAN:{"program_overview":{"training_goal":"力量"},"weekly_program":{"week_number":1,"training_days":[]},"program_balance":{"balance_score":90},"safety_assessment":{"overall_risk_level":"LOW","contraindications_found":0,"safety_recommendations":[],"personalized_notes":[],"medical_consultation_needed":false}}]`
      
      const plans = getMessageTrainingPlans(content)
      
      expect(plans.length).toBe(1)
      expect(plans[0].program_overview.training_goal).toBe('力量')
    })
  })

  describe('formatTrainingPlanForCard', () => {
    it('应该直接返回已是标准格式的数据', () => {
      const standardPlan = {
        program_overview: {
          training_goal: '增肌',
          training_split: '推拉腿',
          training_days_per_week: 3,
          difficulty_level: 'intermediate',
          total_exercises: 9,
          total_weekly_sets: 27,
          estimated_weekly_duration_minutes: 180
        },
        weekly_program: {
          week_number: 1,
          training_days: [{ day_number: 1, day_name: '推日', focus_muscle_groups: [], exercises: [], total_sets: 0, estimated_duration_minutes: 0 }],
          rest_days: [],
          total_weekly_sets: 27,
          muscle_group_distribution: {}
        },
        program_balance: { balance_score: 85 },
        safety_assessment: {
          overall_risk_level: 'LOW' as const,
          contraindications_found: 0,
          safety_recommendations: [],
          personalized_notes: [],
          medical_consultation_needed: false
        }
      }
      
      const result = formatTrainingPlanForCard(standardPlan)
      
      expect(result).toEqual(standardPlan)
    })

    it('应该转换weekly_schedule对象格式', () => {
      const planData = {
        training_goal: 'hypertrophy',
        weekly_schedule: {
          '推日': {
            exercises: [
              { name_zh: '杠铃卧推', sets: 3, reps: '8-12', rest: '90秒' }
            ],
            primary_muscles: ['胸', '肩']
          }
        }
      }
      
      const result = formatTrainingPlanForCard(planData)
      
      expect(result.program_overview.training_goal).toBe('增肌')
      expect(result.weekly_program.training_days.length).toBe(1)
      expect(result.weekly_program.training_days[0].day_name).toBe('推日')
    })

    it('应该转换weekly_split数组格式', () => {
      const planData = {
        training_goal: 'strength',
        weekly_split: [
          {
            day: '第1天',
            focus: '上肢',
            exercises: [
              { name_zh: '引体向上', sets: 4, reps: '6-8', rest: '2分钟' }
            ]
          }
        ]
      }
      
      const result = formatTrainingPlanForCard(planData)
      
      expect(result.weekly_program.training_days.length).toBe(1)
      expect(result.weekly_program.training_days[0].exercises[0].name_zh).toBe('引体向上')
      expect(result.weekly_program.training_days[0].exercises[0].rest_seconds).toBe(120)
    })

    it('应该处理多周计划格式', () => {
      const planData = {
        program_overview: {
          training_goal: '增肌',
          training_split: '全身',
          training_days_per_week: 3,
          difficulty_level: 'beginner',
          total_exercises: 6,
          total_weekly_sets: 18,
          estimated_weekly_duration_minutes: 120
        },
        weekly_programs: [
          {
            week_number: 1,
            training_days: [
              { day_number: 1, day_name: '全身A', focus_muscle_groups: [], exercises: [], total_sets: 6, estimated_duration_minutes: 40 }
            ],
            rest_days: [],
            total_weekly_sets: 18,
            muscle_group_distribution: {}
          }
        ]
      }
      
      const result = formatTrainingPlanForCard(planData)
      
      expect(result.weekly_program.week_number).toBe(1)
      expect(result.weekly_program.training_days.length).toBe(1)
    })
  })
})
