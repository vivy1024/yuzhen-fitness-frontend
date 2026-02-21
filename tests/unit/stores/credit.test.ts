import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCreditStore } from '@/stores/credit'

// Mock API
vi.mock('@/api/credit', () => ({
  getBalance: vi.fn(),
  getHistory: vi.fn(),
  getStats: vi.fn(),
}))

import { getBalance, getHistory, getStats } from '@/api/credit'

const mockBalance = {
  daily_quota: 50,
  daily_consumed: 10,
  remaining: 40,
  total_consumed: 200,
  membership_tier: 'warmheart',
  is_mvp_phase: false,
  low_balance_warning: false,
  last_reset_date: '2026-02-21',
}

describe('Credit Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'mock-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  describe('初始状态', () => {
    it('balance 应为 null', () => {
      const store = useCreditStore()
      expect(store.balance).toBeNull()
      expect(store.initialized).toBe(false)
    })

    it('computed 默认值应正确', () => {
      const store = useCreditStore()
      expect(store.dailyQuota).toBe(0)
      expect(store.dailyConsumed).toBe(0)
      expect(store.remaining).toBe(0)
      expect(store.membershipTier).toBe('free')
      expect(store.usagePercent).toBe(0)
      expect(store.isExhausted).toBe(true)
      expect(store.canSendQuery).toBe(false)
    })
  })

  describe('fetchBalance', () => {
    it('成功获取余额', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 200, data: mockBalance, msg: 'ok' })
      const store = useCreditStore()

      const result = await store.fetchBalance()

      expect(result.success).toBe(true)
      expect(store.balance).toEqual(mockBalance)
      expect(store.dailyQuota).toBe(50)
      expect(store.remaining).toBe(40)
      expect(store.membershipTier).toBe('warmheart')
      expect(store.lastUpdated).toBeInstanceOf(Date)
    })

    it('API 返回错误码', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 401, data: null, msg: '未授权' })
      const store = useCreditStore()

      const result = await store.fetchBalance()

      expect(result.success).toBe(false)
      expect(result.message).toBe('未授权')
    })

    it('网络异常', async () => {
      vi.mocked(getBalance).mockRejectedValue(new Error('Network Error'))
      const store = useCreditStore()

      const result = await store.fetchBalance()

      expect(result.success).toBe(false)
      expect(store.error).toBe('Network Error')
    })
  })

  describe('updateAfterQuery', () => {
    it('正确扣减积分', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 200, data: { ...mockBalance }, msg: 'ok' })
      const store = useCreditStore()
      await store.fetchBalance()

      store.updateAfterQuery(5)

      expect(store.dailyConsumed).toBe(15)
      expect(store.remaining).toBe(35)
      expect(store.totalConsumed).toBe(205)
    })

    it('积分不会变为负数', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 200, data: { ...mockBalance, remaining: 2, daily_consumed: 48 }, msg: 'ok' })
      const store = useCreditStore()
      await store.fetchBalance()

      store.updateAfterQuery(10)

      expect(store.remaining).toBe(0)
    })

    it('低余额警告触发', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 200, data: { ...mockBalance, daily_consumed: 40, remaining: 10 }, msg: 'ok' })
      const store = useCreditStore()
      await store.fetchBalance()

      store.updateAfterQuery(3)

      // remaining = 50 - 43 = 7, threshold = ceil(50 * 0.2) = 10, 7 <= 10 → warning
      expect(store.hasLowBalanceWarning).toBe(true)
    })

    it('balance 为 null 时不崩溃', () => {
      const store = useCreditStore()
      expect(() => store.updateAfterQuery(5)).not.toThrow()
    })
  })

  describe('usagePercent', () => {
    it('正确计算使用百分比', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 200, data: { ...mockBalance, daily_consumed: 25, daily_quota: 50 }, msg: 'ok' })
      const store = useCreditStore()
      await store.fetchBalance()

      expect(store.usagePercent).toBe(50)
    })

    it('不超过100%', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 200, data: { ...mockBalance, daily_consumed: 60, daily_quota: 50 }, msg: 'ok' })
      const store = useCreditStore()
      await store.fetchBalance()

      expect(store.usagePercent).toBe(100)
    })

    it('quota为0时返回0', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 200, data: { ...mockBalance, daily_consumed: 0, daily_quota: 0 }, msg: 'ok' })
      const store = useCreditStore()
      await store.fetchBalance()

      expect(store.usagePercent).toBe(0)
    })
  })

  describe('clearCredit', () => {
    it('清空所有状态', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 200, data: mockBalance, msg: 'ok' })
      const store = useCreditStore()
      await store.fetchBalance()
      store.initialized = true

      store.clearCredit()

      expect(store.balance).toBeNull()
      expect(store.transactions).toEqual([])
      expect(store.stats).toBeNull()
      expect(store.initialized).toBe(false)
      expect(store.lastUpdated).toBeNull()
    })
  })

  describe('init', () => {
    it('有 token 时获取余额', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 200, data: mockBalance, msg: 'ok' })
      const store = useCreditStore()

      await store.init()

      expect(getBalance).toHaveBeenCalled()
      expect(store.initialized).toBe(true)
    })

    it('无 token 时跳过', async () => {
      vi.stubGlobal('localStorage', { getItem: vi.fn(() => null), setItem: vi.fn(), removeItem: vi.fn() })
      const store = useCreditStore()

      await store.init()

      expect(getBalance).not.toHaveBeenCalled()
      expect(store.initialized).toBe(true)
    })

    it('重复调用不重复请求', async () => {
      vi.mocked(getBalance).mockResolvedValue({ code: 200, data: mockBalance, msg: 'ok' })
      const store = useCreditStore()

      await store.init()
      await store.init()

      expect(getBalance).toHaveBeenCalledTimes(1)
    })
  })

  describe('fetchHistory', () => {
    it('成功获取流水', async () => {
      const mockHistory = {
        data: [{ id: 1, credits: 3, type: 'consume' }],
        page: 1,
        total: 1,
        last_page: 1,
      }
      vi.mocked(getHistory).mockResolvedValue({ code: 200, data: mockHistory, msg: 'ok' })
      const store = useCreditStore()

      const result = await store.fetchHistory(1, 'dag')

      expect(result.success).toBe(true)
      expect(store.transactions).toHaveLength(1)
      expect(store.transactionTotal).toBe(1)
    })
  })
})
