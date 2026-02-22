/**
 * 用量状态管理（已废弃）
 * 
 * @deprecated 此store已被credit.ts替代
 * 积分体系改造后，使用useCreditStore管理积分状态
 * 保留此文件仅供参考，请勿在新代码中使用
 * 
 * @see credit.ts
 * @author 薛小川
 * @created 2026-01-11
 * @deprecated 2026-02-05
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getTodayUsage,
  getCredits,
  checkUsage,
  incrementUsage,
  getUsageHistory,
  type TodayUsage,
  type UserCredits,
  type UsageCheckResult,
  type UsageIncrementResult,
  type UsageHistory,
} from '@/api/usage'

export const useUsageStore = defineStore('usage', () => {
  // ==================== State ====================
  
  /**
   * 今日用量数据
   */
  const todayUsage = ref<TodayUsage | null>(null)
  
  /**
   * 额外额度数据
   */
  const credits = ref<UserCredits | null>(null)
  
  /**
   * 用量历史数据
   */
  const history = ref<UsageHistory | null>(null)
  
  /**
   * 加载状态
   */
  const loading = ref(false)
  
  /**
   * 错误信息
   */
  const error = ref<string | null>(null)
  
  /**
   * 是否已初始化
   */
  const initialized = ref(false)
  
  /**
   * 最后更新时间
   */
  const lastUpdated = ref<Date | null>(null)

  // ==================== Getters ====================
  
  /**
   * DAG剩余次数（每日配额 + 额外额度）
   * @requirements 6.1, 6.5
   */
  const dagRemaining = computed(() => {
    const dailyRemaining = todayUsage.value?.dag_remaining ?? 0
    const extraCredits = credits.value?.dag_credits ?? todayUsage.value?.dag_credits ?? 0
    return dailyRemaining + extraCredits
  })
  
  /**
   * Agent剩余次数（每日配额 + 额外额度）
   * @requirements 6.1, 6.5
   */
  const agentRemaining = computed(() => {
    const dailyRemaining = todayUsage.value?.agent_remaining ?? 0
    const extraCredits = credits.value?.agent_credits ?? todayUsage.value?.agent_credits ?? 0
    return dailyRemaining + extraCredits
  })
  
  /**
   * DAG今日已使用次数
   */
  const dagUsed = computed(() => todayUsage.value?.dag_used ?? 0)
  
  /**
   * Agent今日已使用次数
   */
  const agentUsed = computed(() => todayUsage.value?.agent_used ?? 0)
  
  /**
   * DAG每日限制
   */
  const dagLimit = computed(() => todayUsage.value?.dag_limit ?? 10)
  
  /**
   * Agent每日限制
   */
  const agentLimit = computed(() => todayUsage.value?.agent_limit ?? 3)
  
  /**
   * DAG额外额度
   */
  const dagCredits = computed(() => credits.value?.dag_credits ?? todayUsage.value?.dag_credits ?? 0)
  
  /**
   * Agent额外额度
   */
  const agentCredits = computed(() => credits.value?.agent_credits ?? todayUsage.value?.agent_credits ?? 0)
  
  /**
   * 总额外额度
   */
  const totalCredits = computed(() => credits.value?.total_credits ?? (dagCredits.value + agentCredits.value))
  
  /**
   * 是否有低用量警告（剩余≤2次）
   * @requirements 6.3
   */
  const hasLowUsageWarning = computed(() => {
    return dagRemaining.value <= 2 || agentRemaining.value <= 2
  })
  
  /**
   * DAG是否低用量警告
   */
  const isDagLow = computed(() => dagRemaining.value <= 2)
  
  /**
   * Agent是否低用量警告
   */
  const isAgentLow = computed(() => agentRemaining.value <= 2)
  
  /**
   * 是否已达DAG上限
   * @requirements 6.4
   */
  const isDagLimitReached = computed(() => dagRemaining.value <= 0)
  
  /**
   * 是否已达Agent上限
   * @requirements 6.4
   */
  const isAgentLimitReached = computed(() => agentRemaining.value <= 0)
  
  /**
   * 警告消息列表
   */
  const warnings = computed(() => todayUsage.value?.warnings ?? [])
  
  /**
   * 当前日期
   */
  const currentDate = computed(() => todayUsage.value?.date ?? new Date().toISOString().split('T')[0])

  // ==================== Actions ====================
  
  /**
   * 获取今日用量统计
   * @requirements 6.1, 6.2
   */
  async function fetchTodayUsage(): Promise<{ success: boolean; message?: string }> {
    try {
      loading.value = true
      error.value = null
      
      const response = await getTodayUsage()
      
      if (response.code === 200 && response.data) {
        todayUsage.value = response.data
        lastUpdated.value = new Date()
        return { success: true }
      }
      
      return { success: false, message: response.msg || '获取用量统计失败' }
    } catch (err: any) {
      console.error('获取今日用量失败:', err)
      error.value = err.message || '获取用量统计失败'
      return { success: false, message: error.value ?? undefined }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取额外额度余额
   * @requirements 6.5
   */
  async function fetchCredits(): Promise<{ success: boolean; message?: string }> {
    try {
      loading.value = true
      error.value = null
      
      const response = await getCredits()
      
      if (response.code === 200 && response.data) {
        credits.value = response.data
        return { success: true }
      }
      
      return { success: false, message: response.msg || '获取额度余额失败' }
    } catch (err: any) {
      console.error('获取额度余额失败:', err)
      error.value = err.message || '获取额度余额失败'
      return { success: false, message: error.value ?? undefined }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 检查是否可以执行查询
   * @param mode 查询模式：'dag' | 'agent'
   */
  async function checkCanExecute(mode: 'dag' | 'agent'): Promise<UsageCheckResult> {
    try {
      const response = await checkUsage(mode)
      
      if (response.code === 200 && response.data) {
        return response.data
      }
      
      // 429表示用量已达上限
      if (response.code === 429 && response.data) {
        return response.data
      }
      
      return {
        allowed: false,
        remaining: 0,
        use_credits: false,
        message: response.msg || '检查用量失败'
      }
    } catch (err: any) {
      console.error('检查用量失败:', err)
      return {
        allowed: false,
        remaining: 0,
        use_credits: false,
        message: err.message || '检查用量失败'
      }
    }
  }
  
  /**
   * 增加用量计数
   * @param mode 查询模式：'dag' | 'agent'
   * @requirements 6.2
   */
  async function recordUsage(mode: 'dag' | 'agent'): Promise<UsageIncrementResult> {
    try {
      const response = await incrementUsage(mode)
      
      if (response.code === 200 && response.data) {
        // 更新本地用量数据
        await fetchTodayUsage()
        return response.data
      }
      
      return {
        success: false,
        used_credits: false,
        new_count: 0,
        remaining: 0,
        message: response.msg || '记录用量失败'
      }
    } catch (err: any) {
      console.error('记录用量失败:', err)
      return {
        success: false,
        used_credits: false,
        new_count: 0,
        remaining: 0,
        message: err.message || '记录用量失败'
      }
    }
  }
  
  /**
   * 获取用量历史统计
   * @param days 统计天数
   */
  async function fetchHistory(days: number = 30): Promise<{ success: boolean; message?: string }> {
    try {
      loading.value = true
      error.value = null
      
      const response = await getUsageHistory(days)
      
      if (response.code === 200 && response.data) {
        history.value = response.data
        return { success: true }
      }
      
      return { success: false, message: response.msg || '获取用量历史失败' }
    } catch (err: any) {
      console.error('获取用量历史失败:', err)
      error.value = err.message || '获取用量历史失败'
      return { success: false, message: error.value ?? undefined }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 初始化用量数据
   * 同时获取今日用量和额外额度
   */
  async function init(): Promise<void> {
    if (initialized.value) return
    
    const token = localStorage.getItem('access_token')
    if (!token) {
      initialized.value = true
      return
    }
    
    await Promise.all([
      fetchTodayUsage(),
      fetchCredits()
    ])
    
    initialized.value = true
  }
  
  /**
   * 刷新用量数据
   * 强制重新获取所有用量数据
   * @requirements 6.2
   */
  async function refresh(): Promise<void> {
    await Promise.all([
      fetchTodayUsage(),
      fetchCredits()
    ])
  }
  
  /**
   * 清空用量数据（登出时调用）
   */
  function clearUsage(): void {
    todayUsage.value = null
    credits.value = null
    history.value = null
    error.value = null
    initialized.value = false
    lastUpdated.value = null
  }
  
  /**
   * 重新初始化（登录后调用）
   */
  async function reinit(): Promise<void> {
    initialized.value = false
    await init()
  }

  return {
    // State
    todayUsage,
    credits,
    history,
    loading,
    error,
    initialized,
    lastUpdated,
    
    // Getters
    dagRemaining,
    agentRemaining,
    dagUsed,
    agentUsed,
    dagLimit,
    agentLimit,
    dagCredits,
    agentCredits,
    totalCredits,
    hasLowUsageWarning,
    isDagLow,
    isAgentLow,
    isDagLimitReached,
    isAgentLimitReached,
    warnings,
    currentDate,
    
    // Actions
    fetchTodayUsage,
    fetchCredits,
    checkCanExecute,
    recordUsage,
    fetchHistory,
    init,
    refresh,
    clearUsage,
    reinit,
  }
})
