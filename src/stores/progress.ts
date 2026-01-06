/**
 * Progress Store
 * 进度追踪状态管理
 * 
 * 功能：
 * 1. 管理进度记录（体重、体脂、围度）
 * 2. 管理健身目标
 * 3. 提供趋势数据计算
 * 4. 与user store协同工作
 * 
 * @author BUILD_BODY Team
 * @version 1.0.0
 * @created 2026-01-06
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'
import {
  getProgressOverview,
  getProgressRecords,
  createProgressRecord,
  getTrainingCalendar,
  getGoals,
  type ProgressRecord,
  type ProgressOverview,
  type TrainingCalendarDay,
  type FitnessGoal,
  type WeightTrend,
  type FFMITrend,
  type CreateProgressRecordRequest,
} from '@/api/progress'

// 本地存储键
const STORAGE_KEYS = {
  PROGRESS_RECORDS: 'progress_records_cache',
  GOALS: 'fitness_goals_cache',
  LAST_SYNC: 'progress_last_sync',
} as const

export const useProgressStore = defineStore('progress', () => {
  // ==================== State ====================
  const loading = ref(false)
  const error = ref('')
  
  // 进度记录
  const records = ref<ProgressRecord[]>([])
  const recentRecords = ref<ProgressRecord[]>([])
  
  // 目标
  const goals = ref<FitnessGoal[]>([])
  const activeGoals = ref<FitnessGoal[]>([])
  
  // 趋势数据
  const weightTrend = ref<WeightTrend[]>([])
  const ffmiTrend = ref<FFMITrend[]>([])
  const volumeTrend = ref<{ date: string; volume: number }[]>([])
  
  // 日历数据
  const calendarData = ref<TrainingCalendarDay[]>([])
  
  // 统计数据
  const stats = ref({
    totalVolume: 0,
    trainingDaysThisMonth: 0,
    trainingDaysLastMonth: 0,
    currentWeight: 0,
    weightChange: 0,
    currentBodyFat: undefined as number | undefined,
    bodyFatChange: undefined as number | undefined,
    currentFFMI: undefined as number | undefined,
    ffmiChange: undefined as number | undefined,
    totalRecords: 0,
  })
  
  // 同步状态
  const lastSyncAt = ref<string | null>(null)

  // ==================== Getters ====================
  
  /** 是否有进度数据 */
  const hasData = computed(() => records.value.length > 0 || goals.value.length > 0)
  
  /** 最新体重记录 */
  const latestWeight = computed(() => {
    if (weightTrend.value.length === 0) return null
    return weightTrend.value[weightTrend.value.length - 1]
  })
  
  /** 体重变化（相比第一条记录） */
  const weightChangeFromStart = computed(() => {
    if (weightTrend.value.length < 2) return 0
    const first = weightTrend.value[0].weight
    const last = weightTrend.value[weightTrend.value.length - 1].weight
    return last - first
  })

  // ==================== Actions ====================
  
  /**
   * 初始化进度数据
   * 优先从服务器加载，失败则使用本地缓存
   */
  async function init(): Promise<void> {
    loading.value = true
    error.value = ''
    
    try {
      // 尝试从服务器加载
      await loadFromServer()
    } catch (err: any) {
      console.warn('[ProgressStore] 从服务器加载失败，使用本地缓存:', err)
      loadFromLocal()
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 从服务器加载进度数据
   */
  async function loadFromServer(): Promise<void> {
    const userStore = useUserStore()
    
    try {
      // 加载进度概览
      const overviewRes = await getProgressOverview()
      
      if (overviewRes.code === 200 && overviewRes.data) {
        const data = overviewRes.data
        
        // 更新统计数据
        stats.value = {
          ...data.stats,
          // 如果后端没有返回当前体重，从用户档案获取
          currentWeight: data.stats.currentWeight || userStore.userProfile?.basic_info.weight || 0,
          currentBodyFat: data.stats.currentBodyFat || userStore.userProfile?.basic_info.body_fat_percentage,
          currentFFMI: data.stats.currentFFMI || userStore.ffmiData?.ffmi,
        }
        
        // 更新趋势数据
        weightTrend.value = data.weightTrend || []
        ffmiTrend.value = data.ffmiTrend || []
        
        // 从日历数据生成训练量趋势
        if (data.trainingCalendar) {
          calendarData.value = data.trainingCalendar
          volumeTrend.value = data.trainingCalendar
            .filter(d => d.hasTraining && d.totalVolume > 0)
            .map(d => ({ date: d.date, volume: d.totalVolume }))
            .slice(-14)
        }
        
        // 更新目标和记录
        activeGoals.value = data.activeGoals || []
        goals.value = data.activeGoals || []
        recentRecords.value = data.recentRecords || []
        
        // 如果没有体重目标，但用户档案有目标体重，自动创建
        await syncWeightGoalFromProfile()
        
        // 保存到本地缓存
        saveToLocal()
        lastSyncAt.value = new Date().toISOString()
      } else {
        throw new Error(overviewRes.msg || '加载失败')
      }
    } catch (err: any) {
      // 如果API失败，尝试从用户档案构建基础数据
      buildFromUserProfile()
      throw err
    }
  }
  
  /**
   * 从用户档案构建基础进度数据
   * 当后端API不可用时使用
   */
  function buildFromUserProfile(): void {
    const userStore = useUserStore()
    const profile = userStore.userProfile
    
    if (!profile) return
    
    // 从用户档案获取当前数据
    stats.value.currentWeight = profile.basic_info.weight || 0
    stats.value.currentBodyFat = profile.basic_info.body_fat_percentage
    stats.value.currentFFMI = userStore.ffmiData?.ffmi
    
    // 如果有FFMI历史，构建趋势
    if (userStore.ffmiHistory.length > 0) {
      ffmiTrend.value = userStore.ffmiHistory.map(h => ({
        date: h.recorded_at.split('T')[0],
        ffmi: h.ffmi_data.ffmi,
        leanBodyMass: h.ffmi_data.lean_body_mass,
      }))
      
      weightTrend.value = userStore.ffmiHistory.map(h => ({
        date: h.recorded_at.split('T')[0],
        weight: h.weight,
        bodyFat: h.body_fat_percentage,
      }))
    }
  }
  
  /**
   * 从本地缓存加载
   */
  function loadFromLocal(): void {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.PROGRESS_RECORDS)
      if (cached) {
        const data = JSON.parse(cached)
        records.value = data.records || []
        recentRecords.value = data.recentRecords || []
        weightTrend.value = data.weightTrend || []
        ffmiTrend.value = data.ffmiTrend || []
        volumeTrend.value = data.volumeTrend || []
        stats.value = data.stats || stats.value
      }
      
      const cachedGoals = localStorage.getItem(STORAGE_KEYS.GOALS)
      if (cachedGoals) {
        goals.value = JSON.parse(cachedGoals)
        activeGoals.value = goals.value.filter(g => g.status === 'active')
      }
      
      lastSyncAt.value = localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
    } catch (err) {
      console.error('[ProgressStore] 从本地加载失败:', err)
    }
  }
  
  /**
   * 保存到本地缓存
   */
  function saveToLocal(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS_RECORDS, JSON.stringify({
        records: records.value,
        recentRecords: recentRecords.value,
        weightTrend: weightTrend.value,
        ffmiTrend: ffmiTrend.value,
        volumeTrend: volumeTrend.value,
        stats: stats.value,
      }))
      
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals.value))
      
      if (lastSyncAt.value) {
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, lastSyncAt.value)
      }
    } catch (err) {
      console.error('[ProgressStore] 保存到本地失败:', err)
    }
  }
  
  /**
   * 添加进度记录
   * 同时更新用户档案的体重数据
   */
  async function addRecord(data: CreateProgressRecordRequest): Promise<{ success: boolean; message: string }> {
    loading.value = true
    error.value = ''
    
    const userStore = useUserStore()
    
    try {
      // 1. 保存进度记录到后端
      const res = await createProgressRecord(data)
      
      if (res.code === 200 && res.data) {
        // 添加到本地记录
        recentRecords.value.unshift(res.data)
        records.value.unshift(res.data)
        
        // 更新趋势数据
        weightTrend.value.push({
          date: data.date,
          weight: data.weight,
          bodyFat: data.body_fat,
        })
        
        // 更新统计
        stats.value.currentWeight = data.weight
        stats.value.totalRecords++
        if (data.body_fat) {
          stats.value.currentBodyFat = data.body_fat
        }
        
        // 2. 同步更新用户档案的体重
        if (userStore.userProfile) {
          userStore.userProfile.basic_info.weight = data.weight
          if (data.body_fat) {
            userStore.userProfile.basic_info.body_fat_percentage = data.body_fat
          }
          
          // 3. 重新计算FFMI
          try {
            const ffmiResult = await userStore.calculateUserFFMI()
            stats.value.currentFFMI = ffmiResult.ffmi
            
            // 添加到FFMI趋势
            ffmiTrend.value.push({
              date: data.date,
              ffmi: ffmiResult.ffmi,
              leanBodyMass: ffmiResult.lean_body_mass,
            })
          } catch (ffmiErr) {
            console.warn('[ProgressStore] FFMI计算失败:', ffmiErr)
          }
          
          // 4. 上传用户档案到服务器（会触发DAML-RAG预热）
          await userStore.uploadToServer()
        }
        
        // 保存到本地
        saveToLocal()
        
        return { success: true, message: '记录已保存，档案已同步' }
      } else {
        throw new Error(res.msg || '保存失败')
      }
    } catch (err: any) {
      // API失败时，仍然更新本地数据
      console.warn('[ProgressStore] API保存失败，使用本地存储:', err)
      
      // 创建本地记录
      const localRecord: ProgressRecord = {
        id: Date.now(),
        userId: userStore.userId || 1,
        date: data.date,
        weight: data.weight,
        bodyFat: data.body_fat,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      recentRecords.value.unshift(localRecord)
      records.value.unshift(localRecord)
      
      // 更新趋势
      weightTrend.value.push({
        date: data.date,
        weight: data.weight,
        bodyFat: data.body_fat,
      })
      
      // 更新统计
      stats.value.currentWeight = data.weight
      stats.value.totalRecords++
      if (data.body_fat) {
        stats.value.currentBodyFat = data.body_fat
      }
      
      // 更新用户档案（本地）
      if (userStore.userProfile) {
        userStore.userProfile.basic_info.weight = data.weight
        if (data.body_fat) {
          userStore.userProfile.basic_info.body_fat_percentage = data.body_fat
        }
        
        // 重新计算FFMI
        try {
          const ffmiResult = await userStore.calculateUserFFMI()
          stats.value.currentFFMI = ffmiResult.ffmi
          ffmiTrend.value.push({
            date: data.date,
            ffmi: ffmiResult.ffmi,
            leanBodyMass: ffmiResult.lean_body_mass,
          })
        } catch (ffmiErr) {
          console.warn('[ProgressStore] FFMI计算失败:', ffmiErr)
        }
        
        await userStore.saveToLocal()
      }
      
      saveToLocal()
      
      return { success: true, message: '记录已保存（本地），稍后将同步到服务器' }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 加载训练日历数据
   */
  async function loadCalendar(year: number, month: number): Promise<void> {
    try {
      const res = await getTrainingCalendar({ year, month })
      if (res.code === 200 && res.data) {
        calendarData.value = res.data
        
        // 更新训练量趋势
        volumeTrend.value = res.data
          .filter(d => d.hasTraining && d.totalVolume > 0)
          .map(d => ({ date: d.date, volume: d.totalVolume }))
      }
    } catch (err) {
      console.error('[ProgressStore] 加载日历失败:', err)
    }
  }
  
  /**
   * 加载目标列表
   */
  async function loadGoals(): Promise<void> {
    try {
      const res = await getGoals({ status: 'all' })
      if (res.code === 200 && res.data) {
        goals.value = res.data
        activeGoals.value = res.data.filter(g => g.status === 'active')
        saveToLocal()
      }
    } catch (err) {
      console.error('[ProgressStore] 加载目标失败:', err)
    }
  }
  
  /**
   * 从用户档案同步体重目标（双向同步）
   * 1. 如果用户档案有目标体重，但没有对应的体重目标，自动创建
   * 2. 如果已有体重目标，检查是否需要更新当前值
   */
  async function syncWeightGoalFromProfile(): Promise<void> {
    const userStore = useUserStore()
    const profile = userStore.userProfile
    
    if (!profile) return
    
    const targetWeight = profile.fitness_goals?.target_weight
    const currentWeight = profile.basic_info?.weight
    
    // 如果没有目标体重，跳过
    if (!targetWeight) return
    
    // 查找现有的体重目标
    const existingWeightGoal = activeGoals.value.find(g => g.type === 'weight')
    
    if (existingWeightGoal) {
      // 已有体重目标，检查是否需要更新
      const needsUpdate = 
        existingWeightGoal.targetValue !== targetWeight ||
        (currentWeight && existingWeightGoal.currentValue !== currentWeight)
      
      if (needsUpdate) {
        console.log('[ProgressStore] 同步更新体重目标:', { 
          oldTarget: existingWeightGoal.targetValue, 
          newTarget: targetWeight,
          oldCurrent: existingWeightGoal.currentValue,
          newCurrent: currentWeight 
        })
        
        try {
          const { updateGoal } = await import('@/api/progress')
          const res = await updateGoal(existingWeightGoal.id, {
            target_value: targetWeight,
            current_value: currentWeight || existingWeightGoal.currentValue,
          })
          
          if (res.code === 200 && res.data) {
            // 更新本地数据
            const index = activeGoals.value.findIndex(g => g.id === existingWeightGoal.id)
            if (index !== -1) {
              activeGoals.value[index] = res.data
            }
            const goalsIndex = goals.value.findIndex(g => g.id === existingWeightGoal.id)
            if (goalsIndex !== -1) {
              goals.value[goalsIndex] = res.data
            }
          }
        } catch (err) {
          console.warn('[ProgressStore] 更新体重目标失败:', err)
        }
      }
    } else if (currentWeight) {
      // 没有体重目标，自动创建
      console.log('[ProgressStore] 从用户档案创建体重目标:', { currentWeight, targetWeight })
      
      try {
        const { createGoal } = await import('@/api/progress')
        const res = await createGoal({
          type: 'weight',
          name: targetWeight < currentWeight ? '减重目标' : '增重目标',
          target_value: targetWeight,
          current_value: currentWeight,
          unit: 'kg',
        })
        
        if (res.code === 200 && res.data) {
          activeGoals.value.push(res.data)
          goals.value.push(res.data)
          console.log('[ProgressStore] 体重目标创建成功:', res.data)
        }
      } catch (err) {
        console.warn('[ProgressStore] 创建体重目标失败:', err)
      }
    }
  }
  
  /**
   * 更新目标并同步到用户档案
   * 当体重目标更新时，同步更新用户档案的target_weight
   */
  async function updateGoalWithSync(
    goalId: number, 
    data: { current_value?: number; target_value?: number; status?: 'active' | 'completed' | 'abandoned' }
  ): Promise<{ success: boolean; message: string }> {
    const userStore = useUserStore()
    
    try {
      const { updateGoal } = await import('@/api/progress')
      const res = await updateGoal(goalId, data)
      
      if (res.code === 200 && res.data) {
        // 更新本地数据
        const index = activeGoals.value.findIndex(g => g.id === goalId)
        if (index !== -1) {
          if (res.data.status === 'active') {
            activeGoals.value[index] = res.data
          } else {
            activeGoals.value.splice(index, 1)
          }
        }
        const goalsIndex = goals.value.findIndex(g => g.id === goalId)
        if (goalsIndex !== -1) {
          goals.value[goalsIndex] = res.data
        }
        
        // 如果是体重目标，同步到用户档案
        if (res.data.type === 'weight' && userStore.userProfile) {
          if (data.target_value !== undefined) {
            userStore.userProfile.fitness_goals.target_weight = data.target_value
          }
          if (data.current_value !== undefined) {
            userStore.userProfile.basic_info.weight = data.current_value
          }
          // 保存用户档案
          await userStore.uploadToServer()
        }
        
        saveToLocal()
        return { success: true, message: '目标已更新' }
      } else {
        throw new Error(res.msg || '更新失败')
      }
    } catch (err: any) {
      console.error('[ProgressStore] 更新目标失败:', err)
      return { success: false, message: err.message || '更新失败' }
    }
  }
  
  /**
   * 刷新所有数据
   */
  async function refresh(): Promise<void> {
    await loadFromServer()
  }
  
  /**
   * 清除缓存
   */
  function clearCache(): void {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS_RECORDS)
    localStorage.removeItem(STORAGE_KEYS.GOALS)
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC)
    
    records.value = []
    recentRecords.value = []
    goals.value = []
    activeGoals.value = []
    weightTrend.value = []
    ffmiTrend.value = []
    volumeTrend.value = []
    calendarData.value = []
    lastSyncAt.value = null
  }

  return {
    // State
    loading,
    error,
    records,
    recentRecords,
    goals,
    activeGoals,
    weightTrend,
    ffmiTrend,
    volumeTrend,
    calendarData,
    stats,
    lastSyncAt,
    
    // Getters
    hasData,
    latestWeight,
    weightChangeFromStart,
    
    // Actions
    init,
    loadFromServer,
    loadFromLocal,
    saveToLocal,
    addRecord,
    loadCalendar,
    loadGoals,
    syncWeightGoalFromProfile,
    updateGoalWithSync,
    refresh,
    clearCache,
  }
})
