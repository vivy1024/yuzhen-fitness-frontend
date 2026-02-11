/**
 * 积分状态管理
 * 管理用户积分余额、流水历史、消耗统计等
 * 
 * @version v1.0.0
 * @date 2026-02-05
 * @author 薛小川
 * @requirements 4.1, 3.4, 7.3
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getBalance,
  getHistory,
  getStats,
  type CreditBalance,
  type CreditTransaction,
  type CreditStats,
} from '@/api/credit'

export const useCreditStore = defineStore('credit', () => {
  // ==================== State ====================
  
  /**
   * 积分余额数据
   */
  const balance = ref<CreditBalance | null>(null)
  
  /**
   * 流水历史数据
   */
  const transactions = ref<CreditTransaction[]>([])
  
  /**
   * 流水分页信息
   */
  const transactionPage = ref(1)
  const transactionTotal = ref(0)
  const transactionLastPage = ref(1)
  
  /**
   * 统计数据
   */
  const stats = ref<CreditStats | null>(null)
  
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
   * 每日配额
   */
  const dailyQuota = computed(() => balance.value?.daily_quota ?? 0)
  
  /**
   * 今日已消耗
   */
  const dailyConsumed = computed(() => balance.value?.daily_consumed ?? 0)
  
  /**
   * 剩余积分
   * @requirements 4.4
   */
  const remaining = computed(() => balance.value?.remaining ?? 0)
  
  /**
   * 总消耗积分
   */
  const totalConsumed = computed(() => balance.value?.total_consumed ?? 0)
  
  /**
   * 会员等级
   */
  const membershipTier = computed(() => balance.value?.membership_tier ?? 'free')
  
  /**
   * 是否MVP阶段
   */
  const isMvpPhase = computed(() => balance.value?.is_mvp_phase ?? false)
  
  /**
   * 是否低余额警告
   * @requirements 4.5
   */
  const hasLowBalanceWarning = computed(() => balance.value?.low_balance_warning ?? false)
  
  /**
   * 最后重置日期
   */
  const lastResetDate = computed(() => balance.value?.last_reset_date ?? '')
  
  /**
   * 使用进度百分比（0-100）
   * @requirements 7.1
   */
  const usagePercent = computed(() => {
    if (!balance.value || balance.value.daily_quota === 0) return 0
    return Math.min(100, Math.round((balance.value.daily_consumed / balance.value.daily_quota) * 100))
  })
  
  /**
   * 是否积分耗尽
   * @requirements 5.2
   */
  const isExhausted = computed(() => remaining.value <= 0)
  
  /**
   * 是否可以发送查询
   */
  const canSendQuery = computed(() => remaining.value > 0)

  // ==================== Actions ====================
  
  /**
   * 获取积分余额
   * @requirements 4.1, 4.2, 4.3
   */
  async function fetchBalance(): Promise<{ success: boolean; message?: string }> {
    try {
      loading.value = true
      error.value = null
      
      const response = await getBalance()
      
      if (response.code === 200 && response.data) {
        balance.value = response.data
        lastUpdated.value = new Date()
        return { success: true }
      }
      
      return { success: false, message: response.msg || '获取积分余额失败' }
    } catch (err: any) {
      console.error('获取积分余额失败:', err)
      error.value = err.message || '获取积分余额失败'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取流水历史
   * @param page 页码
   * @param mode 筛选模式
   * @requirements 3.4
   */
  async function fetchHistory(
    page: number = 1,
    mode?: 'dag' | 'agent'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      loading.value = true
      error.value = null
      
      const response = await getHistory(page, 20, mode)
      
      if (response.code === 200 && response.data) {
        transactions.value = response.data.data
        transactionPage.value = response.data.page
        transactionTotal.value = response.data.total
        transactionLastPage.value = response.data.last_page
        return { success: true }
      }
      
      return { success: false, message: response.msg || '获取流水历史失败' }
    } catch (err: any) {
      console.error('获取流水历史失败:', err)
      error.value = err.message || '获取流水历史失败'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取消耗统计
   * @param days 统计天数
   * @requirements 3.5
   */
  async function fetchStats(days: number = 30): Promise<{ success: boolean; message?: string }> {
    try {
      loading.value = true
      error.value = null
      
      const response = await getStats(days)
      
      if (response.code === 200 && response.data) {
        stats.value = response.data
        return { success: true }
      }
      
      return { success: false, message: response.msg || '获取统计数据失败' }
    } catch (err: any) {
      console.error('获取统计数据失败:', err)
      error.value = err.message || '获取统计数据失败'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 本地更新积分消耗（对话完成后调用）
   * @param credits 消耗的积分数
   * @requirements 7.3
   */
  function updateAfterQuery(credits: number): void {
    if (balance.value) {
      balance.value.daily_consumed += credits
      balance.value.total_consumed += credits
      // 重新计算剩余积分
      const newRemaining = balance.value.daily_quota - balance.value.daily_consumed
      balance.value.remaining = Math.max(0, newRemaining)
      // 更新低余额警告
      balance.value.low_balance_warning = balance.value.remaining <= Math.ceil(balance.value.daily_quota * 0.2)
    }
  }
  
  /**
   * 初始化积分数据
   */
  async function init(): Promise<void> {
    if (initialized.value) return
    
    const token = localStorage.getItem('access_token')
    if (!token) {
      initialized.value = true
      return
    }
    
    await fetchBalance()
    initialized.value = true
  }
  
  /**
   * 刷新积分数据
   */
  async function refresh(): Promise<void> {
    await fetchBalance()
  }
  
  /**
   * 清空积分数据（登出时调用）
   */
  function clearCredit(): void {
    balance.value = null
    transactions.value = []
    stats.value = null
    error.value = null
    initialized.value = false
    lastUpdated.value = null
    transactionPage.value = 1
    transactionTotal.value = 0
    transactionLastPage.value = 1
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
    balance,
    transactions,
    transactionPage,
    transactionTotal,
    transactionLastPage,
    stats,
    loading,
    error,
    initialized,
    lastUpdated,
    
    // Getters
    dailyQuota,
    dailyConsumed,
    remaining,
    totalConsumed,
    membershipTier,
    isMvpPhase,
    hasLowBalanceWarning,
    lastResetDate,
    usagePercent,
    isExhausted,
    canSendQuery,
    
    // Actions
    fetchBalance,
    fetchHistory,
    fetchStats,
    updateAfterQuery,
    init,
    refresh,
    clearCredit,
    reinit,
  }
})
