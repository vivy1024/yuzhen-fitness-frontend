/**
 * Training Store - 训练计划状态管理
 * 
 * 管理训练计划的列表、详情、激活状态等
 * 
 * @author BUILD_BODY Team
 * @version 1.0.0
 * @created 2025-01-03
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getTrainingPlans,
  getTrainingPlanDetail,
  deleteTrainingPlan,
  activateTrainingPlan,
  exportTrainingPlan,
  startTrainingPlan,
  updateTrainingPlan,
  type TrainingPlanResponse,
  type TrainingPlanDetail,
} from '@/api/training-plan'

// ============ 类型定义 ============

export interface TrainingPlan extends TrainingPlanResponse {
  // 扩展字段
  progress?: number
  lastTrainingDate?: string
}

export interface TrainingPlanFilters {
  status?: 'active' | 'completed' | 'all'
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all'
  goal?: string
  sortBy?: 'createdAt' | 'name' | 'frequency'
  sortOrder?: 'asc' | 'desc'
}

// ============ Store定义 ============

export const useTrainingStore = defineStore('training', () => {
  // ========== State ==========
  const plans = ref<TrainingPlan[]>([])
  const currentPlan = ref<TrainingPlanDetail | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filters = ref<TrainingPlanFilters>({
    status: 'all',
    difficulty: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  // ========== Computed ==========
  
  /** 激活的计划列表 */
  const activePlans = computed(() => 
    plans.value.filter(p => p.isActive)
  )

  /** 已完成的计划列表 */
  const completedPlans = computed(() => 
    plans.value.filter(p => p.completedAt)
  )

  /** 归档的计划列表（非激活且未完成） */
  const archivedPlans = computed(() => 
    plans.value.filter(p => !p.isActive && !p.completedAt)
  )

  /** 当前激活的计划 */
  const activePlan = computed(() => 
    plans.value.find(p => p.isActive) || null
  )

  /** 筛选和排序后的计划列表 */
  const filteredPlans = computed(() => {
    let result = [...plans.value]

    // 状态筛选
    if (filters.value.status && filters.value.status !== 'all') {
      if (filters.value.status === 'active') {
        result = result.filter(p => p.isActive)
      } else if (filters.value.status === 'completed') {
        result = result.filter(p => p.completedAt)
      }
    }

    // 难度筛选
    if (filters.value.difficulty && filters.value.difficulty !== 'all') {
      result = result.filter(p => p.difficulty === filters.value.difficulty)
    }

    // 目标筛选
    if (filters.value.goal) {
      result = result.filter(p => p.goal === filters.value.goal)
    }

    // 排序
    const sortBy = filters.value.sortBy || 'createdAt'
    const sortOrder = filters.value.sortOrder || 'desc'
    
    result.sort((a, b) => {
      let comparison = 0
      
      if (sortBy === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else if (sortBy === 'frequency') {
        comparison = a.frequency - b.frequency
      }
      
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return result
  })

  // ========== Actions ==========

  /**
   * 获取训练计划列表
   */
  async function fetchPlans(params?: {
    status?: 'active' | 'completed'
    difficulty?: 'beginner' | 'intermediate' | 'advanced'
    goal?: string
  }): Promise<TrainingPlan[]> {
    loading.value = true
    error.value = null

    try {
      const response = await getTrainingPlans(params)
      
      if (response.code === 200 && response.data) {
        plans.value = response.data
        console.log('[TrainingStore] Plans loaded:', plans.value.length)
        return plans.value
      } else {
        throw new Error(response.msg || '获取训练计划失败')
      }
    } catch (err: any) {
      error.value = err.message || '获取训练计划失败'
      console.error('[TrainingStore] fetchPlans error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取训练计划详情
   */
  async function fetchPlanDetail(id: number): Promise<TrainingPlanDetail> {
    loading.value = true
    error.value = null

    try {
      const response = await getTrainingPlanDetail(id)
      
      if (response.code === 200 && response.data) {
        currentPlan.value = response.data
        console.log('[TrainingStore] Plan detail loaded:', id)
        return response.data
      } else {
        throw new Error(response.msg || '获取计划详情失败')
      }
    } catch (err: any) {
      error.value = err.message || '获取计划详情失败'
      console.error('[TrainingStore] fetchPlanDetail error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除训练计划
   */
  async function deletePlan(id: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await deleteTrainingPlan(id)
      
      if (response.code === 200) {
        // 从列表中移除
        plans.value = plans.value.filter(p => p.id !== id)
        
        // 如果是当前计划，清空
        if (currentPlan.value?.id === id) {
          currentPlan.value = null
        }
        
        console.log('[TrainingStore] Plan deleted:', id)
      } else {
        throw new Error(response.msg || '删除计划失败')
      }
    } catch (err: any) {
      error.value = err.message || '删除计划失败'
      console.error('[TrainingStore] deletePlan error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 激活训练计划（设为当前计划）
   */
  async function activatePlan(id: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await activateTrainingPlan(id)
      
      if (response.code === 200) {
        // 更新本地状态：停用其他计划，激活当前计划
        plans.value.forEach(p => {
          p.isActive = p.id === id
        })
        
        console.log('[TrainingStore] Plan activated:', id)
      } else {
        throw new Error(response.msg || '激活计划失败')
      }
    } catch (err: any) {
      error.value = err.message || '激活计划失败'
      console.error('[TrainingStore] activatePlan error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 导出训练计划
   */
  async function exportPlan(id: number, format: 'json' | 'pdf' = 'json'): Promise<{ url: string; filename: string }> {
    loading.value = true
    error.value = null

    try {
      const response = await exportTrainingPlan(id, format)
      
      if (response.code === 200 && response.data) {
        console.log('[TrainingStore] Plan exported:', id, format)
        return response.data
      } else {
        throw new Error(response.msg || '导出计划失败')
      }
    } catch (err: any) {
      error.value = err.message || '导出计划失败'
      console.error('[TrainingStore] exportPlan error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 开始训练计划
   */
  async function startPlan(id: number): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await startTrainingPlan(id)
      
      if (response.code === 200 && response.data) {
        // 更新本地状态
        const plan = plans.value.find(p => p.id === id)
        if (plan) {
          plan.startedAt = response.data.startedAt
        }
        
        if (currentPlan.value?.id === id) {
          currentPlan.value.startedAt = response.data.startedAt
        }
        
        console.log('[TrainingStore] Plan started:', id)
      } else {
        throw new Error(response.msg || '开始计划失败')
      }
    } catch (err: any) {
      error.value = err.message || '开始计划失败'
      console.error('[TrainingStore] startPlan error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新训练计划
   */
  async function updatePlan(id: number, data: {
    name?: string
    description?: string
    is_active?: boolean
  }): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await updateTrainingPlan(id, data)
      
      if (response.code === 200) {
        // 更新本地状态
        const plan = plans.value.find(p => p.id === id)
        if (plan) {
          if (data.name) plan.name = data.name
          if (data.description) plan.description = data.description
          if (data.is_active !== undefined) plan.isActive = data.is_active
        }
        
        console.log('[TrainingStore] Plan updated:', id)
      } else {
        throw new Error(response.msg || '更新计划失败')
      }
    } catch (err: any) {
      error.value = err.message || '更新计划失败'
      console.error('[TrainingStore] updatePlan error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置筛选条件
   */
  function setFilters(newFilters: Partial<TrainingPlanFilters>): void {
    filters.value = { ...filters.value, ...newFilters }
  }

  /**
   * 重置筛选条件
   */
  function resetFilters(): void {
    filters.value = {
      status: 'all',
      difficulty: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }
  }

  /**
   * 清空当前计划
   */
  function clearCurrentPlan(): void {
    currentPlan.value = null
  }

  /**
   * 清空所有状态
   */
  function clearState(): void {
    plans.value = []
    currentPlan.value = null
    error.value = null
    resetFilters()
  }

  // ========== Return ==========
  return {
    // State
    plans,
    currentPlan,
    loading,
    error,
    filters,

    // Computed
    activePlans,
    completedPlans,
    archivedPlans,
    activePlan,
    filteredPlans,

    // Actions
    fetchPlans,
    fetchPlanDetail,
    deletePlan,
    activatePlan,
    exportPlan,
    startPlan,
    updatePlan,
    setFilters,
    resetFilters,
    clearCurrentPlan,
    clearState,
  }
})
