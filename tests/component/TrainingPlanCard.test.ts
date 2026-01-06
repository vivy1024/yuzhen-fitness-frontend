/**
 * TrainingPlanCard组件测试
 * 
 * 测试训练计划卡片的渲染、交互和数据展示
 * 
 * @module tests/component/TrainingPlanCard
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import TrainingPlanCard from '@/components/training/TrainingPlanCard.vue'

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/exercise/:id', component: { template: '<div>Exercise</div>' } }
  ]
})

// Mock toast
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('TrainingPlanCard Component', () => {
  // 基础训练计划数据
  const basePlan = {
    program_overview: {
      training_goal: '增肌',
      training_split: 'push_pull_legs',
      training_days_per_week: 4,
      difficulty_level: 'intermediate',
      total_exercises: 12,
      estimated_weekly_duration_minutes: 240
    },
    weekly_program: {
      training_days: [
        {
          day_number: 1,
          day_name: '推日',
          focus_muscle_groups: ['胸', '肩', '三头'],
          exercises: [
            { exercise_id: '1', name_zh: '杠铃卧推', sets: 4, reps_range: [8, 12] as [number, number], rest_seconds: 90 },
            { exercise_id: '2', name_zh: '哑铃飞鸟', sets: 3, reps_range: [10, 15] as [number, number], rest_seconds: 60 }
          ],
          total_sets: 7
        }
      ]
    },
    program_balance: { balance_score: 85 },
    safety_assessment: {
      overall_risk_level: 'LOW' as const,
      safety_recommendations: ['注意热身', '控制重量'],
      personalized_notes: ['根据您的肩伤历史，减少过头推举']
    }
  }

  const createWrapper = (plan = basePlan, options = {}) => {
    return mount(TrainingPlanCard, {
      props: { plan, ...options },
      global: {
        plugins: [router],
        stubs: {
          Progress: true
        }
      }
    })
  }

  describe('计划概览渲染', () => {
    it('应该显示计划标题', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('AI定制推拉腿分化')
    })

    it('应该显示训练目标', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('目标: 增肌')
    })

    it('应该显示难度等级', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('中级')
    })

    it('应该显示训练频率', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('4天/周')
    })

    it('应该显示动作数量', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('12个')
    })

    it('应该显示预计时长', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('240分')
    })

    it('应该显示平衡分数', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('85分')
    })
  })

  describe('难度等级显示', () => {
    it('应该正确显示初级难度', () => {
      const plan = {
        ...basePlan,
        program_overview: { ...basePlan.program_overview, difficulty_level: 'beginner' }
      }
      const wrapper = createWrapper(plan)
      expect(wrapper.text()).toContain('初级')
    })

    it('应该正确显示高级难度', () => {
      const plan = {
        ...basePlan,
        program_overview: { ...basePlan.program_overview, difficulty_level: 'advanced' }
      }
      const wrapper = createWrapper(plan)
      expect(wrapper.text()).toContain('高级')
    })
  })

  describe('训练日展示', () => {
    it('应该显示训练日名称', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('推日')
    })

    it('应该显示目标肌群', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('胸')
      expect(wrapper.text()).toContain('肩')
      expect(wrapper.text()).toContain('三头')
    })

    it('应该显示总组数', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('7组')
    })

    it('应该默认展开第一天', async () => {
      const wrapper = createWrapper()
      // 第一天默认展开，应该显示动作
      expect(wrapper.text()).toContain('杠铃卧推')
    })
  })

  describe('动作列表展示', () => {
    it('应该显示动作名称', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('杠铃卧推')
      expect(wrapper.text()).toContain('哑铃飞鸟')
    })

    it('应该显示组数和次数', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('4组')
      expect(wrapper.text()).toContain('8-12次')
    })

    it('应该显示休息时间', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('90s')
    })
  })

  describe('安全评估显示', () => {
    it('应该显示风险等级', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('低风险')
    })

    it('应该显示安全建议', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('注意热身')
    })

    it('应该显示个性化调整说明', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('个性化调整')
      expect(wrapper.text()).toContain('根据您的肩伤历史')
    })

    it('应该正确显示中等风险', () => {
      const plan = {
        ...basePlan,
        safety_assessment: { ...basePlan.safety_assessment, overall_risk_level: 'MODERATE' as const }
      }
      const wrapper = createWrapper(plan)
      expect(wrapper.text()).toContain('中等风险')
    })

    it('应该正确显示高风险', () => {
      const plan = {
        ...basePlan,
        safety_assessment: { ...basePlan.safety_assessment, overall_risk_level: 'HIGH' as const }
      }
      const wrapper = createWrapper(plan)
      expect(wrapper.text()).toContain('高风险')
    })
  })

  describe('导入功能', () => {
    it('应该显示导入按钮', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('导入到我的计划')
    })

    it('应该在点击时触发import事件', async () => {
      const wrapper = createWrapper()
      // 找到包含"导入"文字的按钮
      const buttons = wrapper.findAll('button')
      const importButton = buttons.find(b => b.text().includes('导入'))
      expect(importButton).toBeDefined()
      await importButton!.trigger('click')
      
      expect(wrapper.emitted('import')).toBeTruthy()
      expect(wrapper.emitted('import')![0]).toEqual([basePlan])
    })

    it('应该可以隐藏导入按钮', () => {
      const wrapper = createWrapper(basePlan, { showImportButton: false })
      expect(wrapper.text()).not.toContain('导入到我的计划')
    })
  })

  describe('训练分化类型映射', () => {
    it('应该正确显示全身训练', () => {
      const plan = {
        ...basePlan,
        program_overview: { ...basePlan.program_overview, training_split: 'full_body' }
      }
      const wrapper = createWrapper(plan)
      expect(wrapper.text()).toContain('AI定制全身训练')
    })

    it('应该正确显示上下肢分化', () => {
      const plan = {
        ...basePlan,
        program_overview: { ...basePlan.program_overview, training_split: 'upper_lower' }
      }
      const wrapper = createWrapper(plan)
      expect(wrapper.text()).toContain('AI定制上下肢分化')
    })

    it('应该正确显示部位分化', () => {
      const plan = {
        ...basePlan,
        program_overview: { ...basePlan.program_overview, training_split: 'bro_split' }
      }
      const wrapper = createWrapper(plan)
      expect(wrapper.text()).toContain('AI定制部位分化')
    })
  })

  describe('数据来源提示', () => {
    it('应该显示数据来源说明', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('基于1790个专业动作数据库')
    })
  })
})
