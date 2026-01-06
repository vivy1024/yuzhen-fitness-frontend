/**
 * User Store测试
 * 
 * 测试用户档案状态管理的核心逻辑
 * 
 * @module tests/unit/stores/user
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '@/stores/user'

// Mock API模块
vi.mock('@/api/user', () => ({
  userProfileApi: {
    get: vi.fn(),
    update: vi.fn()
  }
}))

// Mock warmup API
vi.mock('@/api/warmup', () => ({
  warmupUser: vi.fn(() => Promise.resolve({ success: true }))
}))

// Mock FFMI计算器
vi.mock('@/utils/ffmi-calculator', () => ({
  calculateFFMI: vi.fn(() => ({
    ffmi: 22.5,
    adjusted_ffmi: 23.0,
    category: 'intermediate',
    percentile: 65,
    natural_limit_estimate: 25.0
  }))
}))

describe('User Store', () => {
  let store: ReturnType<typeof useUserStore>
  let localStorageMock: Record<string, string>

  beforeEach(() => {
    setActivePinia(createPinia())
    
    // Mock localStorage using stubGlobal
    localStorageMock = {}
    const localStorageStub = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => { localStorageMock[key] = value }),
      removeItem: vi.fn((key: string) => { delete localStorageMock[key] }),
      clear: vi.fn(() => { localStorageMock = {} }),
      length: 0,
      key: vi.fn()
    }
    vi.stubGlobal('localStorage', localStorageStub)
    
    store = useUserStore()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  describe('初始状态', () => {
    it('应该有正确的初始状态', () => {
      expect(store.userProfile).toBeNull()
      expect(store.ffmiData).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.syncedToServer).toBe(false)
      expect(store.error).toBe('')
    })
  })

  describe('计算属性', () => {
    it('isComplete应该在没有档案时返回false', () => {
      expect(store.isComplete).toBe(false)
    })

    it('completionRate应该在没有档案时返回0', () => {
      expect(store.completionRate).toBe(0)
    })

    it('isBeginner应该正确判断初学者', () => {
      store.createEmptyProfile()
      store.userProfile!.basic_info.fitness_level = 'beginner'
      expect(store.isBeginner).toBe(true)
      
      store.userProfile!.basic_info.fitness_level = 'intermediate'
      expect(store.isBeginner).toBe(false)
    })

    it('userName应该返回昵称或默认值', () => {
      expect(store.userName).toBe('未设置')
      
      store.createEmptyProfile()
      store.userProfile!.basic_info.nickname = '测试用户'
      expect(store.userName).toBe('测试用户')
    })

    it('userId应该返回用户ID或null', () => {
      expect(store.userId).toBeNull()
      
      store.createEmptyProfile()
      expect(store.userId).toBe(1) // 默认ID
    })
  })

  describe('createEmptyProfile方法', () => {
    it('应该创建空档案', () => {
      store.createEmptyProfile()
      
      expect(store.userProfile).not.toBeNull()
      expect(store.userProfile?.basic_info.nickname).toBe('')
      expect(store.userProfile?.fitness_goals.primary_goals).toEqual([])
      expect(store.userProfile?.training_preferences.available_equipment).toEqual([])
    })

    it('应该使用localStorage中的用户ID', () => {
      localStorageMock['current_user_id'] = '123'
      store.createEmptyProfile()
      
      expect(store.userProfile?.user_id).toBe(123)
    })
  })

  describe('updateBasicInfo方法', () => {
    it('应该更新基础信息', () => {
      store.createEmptyProfile()
      
      const newInfo = {
        nickname: '新昵称',
        age: 25,
        gender: 'male' as const,
        height: 175,
        weight: 70,
        fitness_level: 'intermediate' as const
      }
      
      store.updateBasicInfo(newInfo)
      
      expect(store.userProfile?.basic_info.nickname).toBe('新昵称')
      expect(store.userProfile?.basic_info.age).toBe(25)
      expect(store.userProfile?.basic_info.height).toBe(175)
    })

    it('应该在没有档案时先创建空档案', () => {
      const newInfo = {
        nickname: '测试',
        age: 30,
        gender: 'female' as const,
        height: 165,
        weight: 55
      }
      
      store.updateBasicInfo(newInfo)
      
      expect(store.userProfile).not.toBeNull()
      expect(store.userProfile?.basic_info.nickname).toBe('测试')
    })
  })

  describe('updateFitnessGoals方法', () => {
    it('应该更新健身目标', () => {
      store.createEmptyProfile()
      
      const newGoals = {
        primary_goals: ['增肌', '力量'],
        goal_priority: { '增肌': 1, '力量': 2 },
        training_split: 'push_pull_legs' as const
      }
      
      store.updateFitnessGoals(newGoals)
      
      expect(store.userProfile?.fitness_goals.primary_goals).toEqual(['增肌', '力量'])
      expect(store.userProfile?.fitness_goals.training_split).toBe('push_pull_legs')
    })
  })

  describe('updateTrainingPreferences方法', () => {
    it('应该更新训练偏好', () => {
      store.createEmptyProfile()
      
      const newPrefs = {
        training_split: 'upper_lower' as const,
        available_equipment: ['杠铃', '哑铃', '拉力器'],
        training_location: 'gym' as const
      }
      
      store.updateTrainingPreferences(newPrefs)
      
      expect(store.userProfile?.training_preferences.available_equipment).toEqual(['杠铃', '哑铃', '拉力器'])
      expect(store.userProfile?.training_preferences.training_location).toBe('gym')
    })
  })

  describe('updateHealthStatus方法', () => {
    it('应该更新健康状况', () => {
      store.createEmptyProfile()
      
      const newStatus = {
        chronic_diseases: ['高血压'],
        injury_history: [{ area: '膝盖', description: '半月板损伤', severity: 'moderate' as const }],
        medications: ['降压药']
      }
      
      store.updateHealthStatus(newStatus)
      
      expect(store.userProfile?.health_status.chronic_diseases).toEqual(['高血压'])
      expect(store.userProfile?.health_status.injury_history).toHaveLength(1)
    })
  })

  describe('resetProfile方法', () => {
    it('应该重置所有档案数据', () => {
      store.createEmptyProfile()
      store.userProfile!.basic_info.nickname = '测试'
      store.ffmiData = { ffmi: 22 } as any
      store.syncedToServer = true
      store.error = '测试错误'
      
      store.resetProfile()
      
      expect(store.userProfile).toBeNull()
      expect(store.ffmiData).toBeNull()
      expect(store.syncedToServer).toBe(false)
      expect(store.error).toBe('')
    })
  })

  describe('clearError方法', () => {
    it('应该清除错误信息', () => {
      store.error = '测试错误'
      store.clearError()
      
      expect(store.error).toBe('')
    })
  })

  describe('completionRate计算', () => {
    it('应该正确计算完成率', () => {
      store.createEmptyProfile()
      
      // 初始完成率应该很低
      const initialRate = store.completionRate
      expect(initialRate).toBeLessThan(50)
      
      // 填写基础信息后完成率应该提高
      store.userProfile!.basic_info = {
        nickname: '测试',
        age: 25,
        gender: 'male',
        height: 175,
        weight: 70,
        fitness_level: 'intermediate',
        body_fat_percentage: 15
      }
      
      const newRate = store.completionRate
      expect(newRate).toBeGreaterThan(initialRate)
    })
  })
})
