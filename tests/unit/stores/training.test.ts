/**
 * Training Store测试
 * 
 * 测试训练计划状态管理的核心逻辑
 * 
 * @module tests/unit/stores/training
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTrainingStore } from '@/stores/training'

// Mock API模块
vi.mock('@/api/training-plan', () => ({
  getTrainingPlans: vi.fn(),
  getTrainingPlanDetail: vi.fn(),
  deleteTrainingPlan: vi.fn(),
  activateTrainingPlan: vi.fn(),
  exportTrainingPlan: vi.fn(),
  startTrainingPlan: vi.fn(),
  updateTrainingPlan: vi.fn()
}))

describe('Training Store', () => {
  let store: ReturnType<typeof useTrainingStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTrainingStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(store.plans).toEqual([])
      expect(store.currentPlan).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('应该有默认的筛选条件', () => {
      expect(store.filters).toEqual({
        status: 'all',
        difficulty: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
    })
  })

  describe('计算属性', () => {
    const mockPlans = [
      { id: 1, name: '计划1', isActive: true, completedAt: null, difficulty: 'beginner', frequency: 3, createdAt: '2026-01-01' },
      { id: 2, name: '计划2', isActive: false, completedAt: '2026-01-05', difficulty: 'intermediate', frequency: 4, createdAt: '2026-01-02' },
      { id: 3, name: '计划3', isActive: false, completedAt: null, difficulty: 'advanced', frequency: 5, createdAt: '2026-01-03' }
    ]

    beforeEach(() => {
      store.plans = mockPlans as any
    })

    it('activePlans应该返回激活的计划', () => {
      expect(store.activePlans).toHaveLength(1)
      expect(store.activePlans[0].id).toBe(1)
    })

    it('completedPlans应该返回已完成的计划', () => {
      expect(store.completedPlans).toHaveLength(1)
      expect(store.completedPlans[0].id).toBe(2)
    })

    it('archivedPlans应该返回归档的计划', () => {
      expect(store.archivedPlans).toHaveLength(1)
      expect(store.archivedPlans[0].id).toBe(3)
    })

    it('activePlan应该返回当前激活的计划', () => {
      expect(store.activePlan?.id).toBe(1)
    })

    it('activePlan应该在没有激活计划时返回null', () => {
      store.plans = mockPlans.map(p => ({ ...p, isActive: false })) as any
      expect(store.activePlan).toBeNull()
    })
  })

  describe('筛选功能', () => {
    const mockPlans = [
      { id: 1, name: 'A计划', isActive: true, completedAt: null, difficulty: 'beginner', frequency: 3, createdAt: '2026-01-01', goal: '增肌' },
      { id: 2, name: 'B计划', isActive: false, completedAt: '2026-01-05', difficulty: 'intermediate', frequency: 4, createdAt: '2026-01-02', goal: '减脂' },
      { id: 3, name: 'C计划', isActive: false, completedAt: null, difficulty: 'advanced', frequency: 5, createdAt: '2026-01-03', goal: '增肌' }
    ]

    beforeEach(() => {
      store.plans = mockPlans as any
    })

    it('应该按状态筛选 - active', () => {
      store.setFilters({ status: 'active' })
      expect(store.filteredPlans).toHaveLength(1)
      expect(store.filteredPlans[0].id).toBe(1)
    })

    it('应该按状态筛选 - completed', () => {
      store.setFilters({ status: 'completed' })
      expect(store.filteredPlans).toHaveLength(1)
      expect(store.filteredPlans[0].id).toBe(2)
    })

    it('应该按难度筛选', () => {
      store.setFilters({ difficulty: 'beginner' })
      expect(store.filteredPlans).toHaveLength(1)
      expect(store.filteredPlans[0].difficulty).toBe('beginner')
    })

    it('应该按目标筛选', () => {
      store.setFilters({ goal: '增肌' })
      expect(store.filteredPlans).toHaveLength(2)
    })

    it('应该按名称排序', () => {
      store.setFilters({ sortBy: 'name', sortOrder: 'asc' })
      expect(store.filteredPlans[0].name).toBe('A计划')
      expect(store.filteredPlans[2].name).toBe('C计划')
    })

    it('应该按频率排序', () => {
      store.setFilters({ sortBy: 'frequency', sortOrder: 'desc' })
      expect(store.filteredPlans[0].frequency).toBe(5)
    })
  })

  describe('setFilters方法', () => {
    it('应该更新筛选条件', () => {
      store.setFilters({ status: 'active', difficulty: 'beginner' })
      
      expect(store.filters.status).toBe('active')
      expect(store.filters.difficulty).toBe('beginner')
      // 其他条件保持不变
      expect(store.filters.sortBy).toBe('createdAt')
    })
  })

  describe('resetFilters方法', () => {
    it('应该重置筛选条件到默认值', () => {
      store.setFilters({ status: 'active', difficulty: 'beginner' })
      store.resetFilters()
      
      expect(store.filters).toEqual({
        status: 'all',
        difficulty: 'all',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })
    })
  })

  describe('clearCurrentPlan方法', () => {
    it('应该清空当前计划', () => {
      store.currentPlan = { id: 1, name: '测试计划' } as any
      store.clearCurrentPlan()
      
      expect(store.currentPlan).toBeNull()
    })
  })

  describe('clearState方法', () => {
    it('应该清空所有状态', () => {
      store.plans = [{ id: 1 }] as any
      store.currentPlan = { id: 1 } as any
      store.error = '测试错误'
      store.setFilters({ status: 'active' })
      
      store.clearState()
      
      expect(store.plans).toEqual([])
      expect(store.currentPlan).toBeNull()
      expect(store.error).toBeNull()
      expect(store.filters.status).toBe('all')
    })
  })
})
