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
import { ref } from 'vue'

/**
 * @deprecated 使用 useCreditStore 替代
 */
export const useUsageStore = defineStore('usage', () => {
  // 此 store 已废弃，所有 DAG/Agent 次数逻辑已移除
  // 请使用 useCreditStore（@/stores/credit）管理积分状态

  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  // 保留空壳方法，避免引用此 store 的旧代码报错
  async function init(): Promise<void> {
    initialized.value = true
  }

  async function refresh(): Promise<void> {
    // no-op
  }

  function clearUsage(): void {
    error.value = null
    initialized.value = false
  }

  async function reinit(): Promise<void> {
    initialized.value = false
    await init()
  }

  return {
    // State
    loading,
    error,
    initialized,

    // Actions
    init,
    refresh,
    clearUsage,
    reinit,
  }
})
