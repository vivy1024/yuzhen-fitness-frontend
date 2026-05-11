/**
 * 积分 v2 状态管理
 * 管理积分余额、流水、签到等
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getBalance,
  getTransactions,
  checkin,
  type CreditBalance,
  type CreditTransaction,
} from '@/api/credits'

export const useCreditsStore = defineStore('credits', () => {
  // ==================== State ====================

  const balance = ref<CreditBalance | null>(null)
  const transactions = ref<CreditTransaction[]>([])
  const currentPage = ref(1)
  const lastPage = ref(1)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const checkinLoading = ref(false)

  // ==================== Getters ====================

  /** 月度使用进度百分比 (0-100) */
  const usagePercent = computed(() => {
    if (!balance.value) return 0
    const limit = parseFloat(balance.value.monthly_limit)
    if (limit === 0) return 0
    const used = parseFloat(balance.value.used_this_month)
    return Math.min(100, Math.round((used / limit) * 100))
  })

  /** 是否还有更多流水可加载 */
  const hasMore = computed(() => currentPage.value < lastPage.value)

  /** 等级中文名 */
  const tierLabel = computed(() => {
    const map: Record<string, string> = {
      free: '免费用户',
      warmheart: '暖心会员',
      energy: '能量会员',
    }
    return map[balance.value?.tier ?? 'free'] ?? '免费用户'
  })

  // ==================== Actions ====================

  /** 加载积分余额 */
  async function loadBalance() {
    try {
      loading.value = true
      error.value = null
      const response = await getBalance()
      if (response.code === 200 && response.data) {
        balance.value = response.data
      } else {
        error.value = response.msg || '获取积分余额失败'
      }
    } catch (err: any) {
      error.value = err.message || '获取积分余额失败'
    } finally {
      loading.value = false
    }
  }

  /** 加载积分流水 */
  async function loadTransactions(page = 1) {
    try {
      loading.value = true
      error.value = null
      const response = await getTransactions(page)
      if (response.code === 200 && response.data) {
        if (page === 1) {
          transactions.value = response.data.data
        } else {
          transactions.value.push(...response.data.data)
        }
        currentPage.value = response.data.current_page
        lastPage.value = response.data.last_page
      } else {
        error.value = response.msg || '获取流水失败'
      }
    } catch (err: any) {
      error.value = err.message || '获取流水失败'
    } finally {
      loading.value = false
    }
  }

  /** 加载更多流水 */
  async function loadMore() {
    if (!hasMore.value || loading.value) return
    await loadTransactions(currentPage.value + 1)
  }

  /** 每日签到 */
  async function doCheckin(): Promise<{ success: boolean; message: string }> {
    try {
      checkinLoading.value = true
      const response = await checkin()
      if (response.code === 200) {
        // 签到成功后刷新余额
        await loadBalance()
        return { success: true, message: response.msg || '签到成功' }
      }
      return { success: false, message: response.msg || '签到失败' }
    } catch (err: any) {
      return { success: false, message: err.message || '签到失败' }
    } finally {
      checkinLoading.value = false
    }
  }

  /** 清空数据（登出时调用） */
  function clear() {
    balance.value = null
    transactions.value = []
    currentPage.value = 1
    lastPage.value = 1
    error.value = null
  }

  return {
    // State
    balance,
    transactions,
    currentPage,
    lastPage,
    loading,
    error,
    checkinLoading,

    // Getters
    usagePercent,
    hasMore,
    tierLabel,

    // Actions
    loadBalance,
    loadTransactions,
    loadMore,
    doCheckin,
    clear,
  }
})
