import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMembershipStore } from '@/stores/membership'

// Mock API
vi.mock('@/api/membership', () => ({
  getMembershipConfig: vi.fn(),
  getCurrentMembership: vi.fn(),
  getMembershipTiers: vi.fn(),
  checkPermission: vi.fn(),
  createPaymentOrder: vi.fn(),
  getPaymentStatus: vi.fn(),
  cancelPaymentOrder: vi.fn(),
  getPaymentHistory: vi.fn(),
  cancelAutoRenew: vi.fn(),
  enableAutoRenew: vi.fn(),
}))

import { getMembershipConfig, getCurrentMembership } from '@/api/membership'

describe('Membership Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('membership 应为 null', () => {
      const store = useMembershipStore()
      expect(store.membership).toBeNull()
    })

    it('默认为免费用户', () => {
      const store = useMembershipStore()
      expect(store.currentTier).toBe('free')
      expect(store.isVip).toBe(false)
      expect(store.membershipName).toBe('免费用户')
      expect(store.remainingDays).toBe(0)
    })

    it('会员系统默认禁用', () => {
      const store = useMembershipStore()
      expect(store.isSystemEnabled).toBe(false)
      expect(store.showMembershipCenter).toBe(false)
      expect(store.showPurchaseButton).toBe(false)
      expect(store.showDonationSection).toBe(true) // 默认显示打赏
    })
  })

  describe('currentTier 计算', () => {
    it('JWT tier 优先于 API 数据', () => {
      const store = useMembershipStore()
      store.jwtTier = 'energy'
      store.membership = {
        is_active: true,
        remaining_days: 30,
        membership_type: 'warmheart',
        membership: { slug: 'warmheart', name: '暖心会员' },
      } as any

      expect(store.currentTier).toBe('energy')
    })

    it('会员过期返回 free', () => {
      const store = useMembershipStore()
      store.membership = {
        is_active: false,
        remaining_days: 0,
        membership_type: 'warmheart',
        membership: { slug: 'warmheart', name: '暖心会员' },
      } as any

      expect(store.currentTier).toBe('free')
    })

    it('活跃 warmheart 会员', () => {
      const store = useMembershipStore()
      store.membership = {
        is_active: true,
        remaining_days: 15,
        membership_type: 'warmheart',
        membership: { slug: 'warmheart', name: '暖心会员' },
      } as any

      expect(store.currentTier).toBe('warmheart')
      expect(store.isVip).toBe(true)
    })

    it('活跃 energy 会员', () => {
      const store = useMembershipStore()
      store.membership = {
        is_active: true,
        remaining_days: 30,
        membership_type: 'energy',
        membership: { slug: 'energy', name: '能量会员' },
      } as any

      expect(store.currentTier).toBe('energy')
      expect(store.isVip).toBe(true)
    })

    it('无效 JWT tier 降级到 API 数据', () => {
      const store = useMembershipStore()
      store.jwtTier = 'invalid_tier'
      store.membership = {
        is_active: true,
        remaining_days: 10,
        membership_type: 'warmheart',
        membership: { slug: 'warmheart', name: '暖心会员' },
      } as any

      expect(store.currentTier).toBe('warmheart')
    })
  })

  describe('isSystemEnabled', () => {
    it('配置启用时返回 true', () => {
      const store = useMembershipStore()
      store.systemConfig = {
        membership_enabled: true,
        show_membership_center: true,
        show_purchase_button: true,
        show_donation_section: false,
      } as any

      expect(store.isSystemEnabled).toBe(true)
      expect(store.showMembershipCenter).toBe(true)
      expect(store.showPurchaseButton).toBe(true)
      expect(store.showDonationSection).toBe(false)
    })
  })

  describe('membershipName', () => {
    it('有 membership.name 时使用', () => {
      const store = useMembershipStore()
      store.membership = {
        is_active: true,
        remaining_days: 30,
        membership: { name: '能量会员', slug: 'energy' },
      } as any

      expect(store.membershipName).toBe('能量会员')
    })

    it('无 membership 时降级到 membership_type', () => {
      const store = useMembershipStore()
      store.membership = {
        is_active: true,
        remaining_days: 30,
        membership_type: 'warmheart',
      } as any

      expect(store.membershipName).toBe('warmheart')
    })
  })
})
