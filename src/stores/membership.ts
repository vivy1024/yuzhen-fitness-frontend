/**
 * 会员状态管理
 * 管理用户会员等级、权限、到期时间、支付、账单历史等
 * 
 * @author 玉珍健身 v3.0
 * @created 2026-01-02
 * @updated 2026-01-09 添加会员系统配置开关支持
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getMembershipConfig,
  getCurrentMembership, 
  getMembershipTiers, 
  checkPermission,
  createPaymentOrder,
  getPaymentStatus,
  cancelPaymentOrder,
  getPaymentHistory,
  cancelAutoRenew,
  enableAutoRenew
} from '@/api/membership'
import type { UserMembership, MembershipTier, PaymentOrder, BillingRecord, MembershipConfig } from '@/api/membership'

export const useMembershipStore = defineStore('membership', () => {
  // State
  const membership = ref<UserMembership | null>(null)
  const tiers = ref<MembershipTier[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  
  // 会员系统配置状态
  const systemConfig = ref<MembershipConfig | null>(null)
  const configLoaded = ref(false)
  
  // 支付相关状态
  const currentOrder = ref<PaymentOrder | null>(null)
  const paymentLoading = ref(false)
  const paymentPolling = ref(false)
  
  // 账单历史
  const billingRecords = ref<BillingRecord[]>([])
  const billingTotal = ref(0)
  const billingPage = ref(1)
  const billingLoading = ref(false)

  // Getters
  
  /**
   * 会员系统是否启用
   */
  const isSystemEnabled = computed(() => {
    return systemConfig.value?.membership_enabled ?? false
  })

  /**
   * 是否显示会员中心
   */
  const showMembershipCenter = computed(() => {
    return systemConfig.value?.show_membership_center ?? false
  })

  /**
   * 是否显示购买按钮
   */
  const showPurchaseButton = computed(() => {
    return systemConfig.value?.show_purchase_button ?? false
  })

  /**
   * 是否显示打赏区域
   */
  const showDonationSection = computed(() => {
    return systemConfig.value?.show_donation_section ?? true
  })

  /**
   * 统一限制（会员系统禁用时使用）
   */
  const unifiedLimits = computed(() => {
    return systemConfig.value?.unified_limits ?? null
  })

  /**
   * 系统提示消息
   */
  const systemMessage = computed(() => {
    return systemConfig.value?.message ?? null
  })
  
  /**
   * 是否是VIP会员
   */
  const isVip = computed(() => {
    // 会员系统禁用时，所有用户都不是VIP
    if (!isSystemEnabled.value) return false
    if (!membership.value) return false
    return membership.value.is_active && membership.value.remaining_days > 0
  })

  /**
   * 会员类型名称
   */
  const membershipName = computed(() => {
    if (!membership.value) return '免费用户'
    return membership.value.membership?.name || membership.value.membership_type || '免费用户'
  })

  /**
   * 剩余天数
   */
  const remainingDays = computed(() => {
    return membership.value?.remaining_days || 0
  })

  /**
   * 是否即将过期（7天内）
   */
  const isExpiringSoon = computed(() => {
    return isVip.value && remainingDays.value <= 7
  })

  /**
   * 每日AI查询限制
   */
  const dailyAiQueryLimit = computed(() => {
    // 会员系统禁用时，使用统一限制
    if (!isSystemEnabled.value && unifiedLimits.value) {
      return unifiedLimits.value.ai_queries_per_day
    }
    if (!membership.value?.membership?.limits) {
      return 5 // 免费用户默认5次
    }
    return membership.value.membership.limits.daily_ai_queries || 5
  })

  /**
   * 最大训练计划数
   */
  const maxTrainingPlans = computed(() => {
    // 会员系统禁用时，使用统一限制
    if (!isSystemEnabled.value && unifiedLimits.value) {
      return unifiedLimits.value.max_training_plans
    }
    if (!membership.value?.membership?.limits) {
      return 3 // 免费用户默认3个
    }
    return membership.value.membership.limits.max_training_plans || 3
  })

  /**
   * 是否有高级功能权限
   */
  const hasAdvancedFeatures = computed(() => {
    return membership.value?.membership?.limits?.advanced_features || false
  })

  /**
   * 是否开启自动续费
   */
  const autoRenewEnabled = computed(() => {
    return membership.value?.auto_renew || false
  })

  /**
   * 到期日期格式化
   */
  const expiresAtFormatted = computed(() => {
    if (!membership.value?.expires_at) return '-'
    return new Date(membership.value.expires_at).toLocaleDateString('zh-CN')
  })

  // Actions

  /**
   * 获取会员系统配置
   */
  async function fetchConfig() {
    try {
      const response = await getMembershipConfig()
      if (response.code === 200) {
        systemConfig.value = response.data
        configLoaded.value = true
      }
      return { success: true }
    } catch (err: any) {
      console.error('获取会员配置失败:', err)
      // 配置获取失败时，默认禁用会员系统
      systemConfig.value = {
        membership_enabled: false,
        show_membership_center: false,
        show_purchase_button: false,
        show_pricing_table: false,
        show_donation_section: true,
        unified_limits: {
          ai_queries_per_day: 10,
          max_training_plans: 5,
          dag_templates: [],
          dag_template_count: 13,
          complexity_limits: { simple: 10, medium: 5, complex: 3 },
          unlock_all_exercises: true,
          ai_recommendation: true,
          data_analysis: false,
          coach_service: false,
        },
        message: '当前为免费体验模式'
      }
      configLoaded.value = true
      return { success: false, message: err.message }
    }
  }

  /**
   * 初始化会员信息
   */
  async function init() {
    if (initialized.value) return
    
    // 首先获取系统配置（无需认证）
    if (!configLoaded.value) {
      await fetchConfig()
    }
    
    const token = localStorage.getItem('access_token')
    if (!token) {
      initialized.value = true
      return
    }
    
    // 只有会员系统启用时才获取会员等级
    const promises = [fetchMembership()]
    if (isSystemEnabled.value) {
      promises.push(fetchTiers())
    }
    
    await Promise.all(promises)
    
    initialized.value = true
  }

  /**
   * 获取当前用户会员信息
   */
  async function fetchMembership() {
    try {
      loading.value = true
      error.value = null
      
      const response = await getCurrentMembership()
      if (response.code === 200) {
        membership.value = response.data
      }
      
      return { success: true }
    } catch (err: any) {
      console.error('获取会员信息失败:', err)
      error.value = err.message || '获取会员信息失败'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取所有会员等级
   */
  async function fetchTiers() {
    try {
      const response = await getMembershipTiers()
      if (response.code === 200 && response.data) {
        // API返回 { memberships: [...], count: n }，需要提取memberships数组
        const membershipsData = response.data.memberships || response.data
        
        // 映射API字段到前端期望的字段
        if (Array.isArray(membershipsData)) {
          tiers.value = membershipsData.map((item: any) => ({
            id: item.id,
            name: item.name,
            slug: item.slug,
            price: item.price || 0,
            original_price: item.original_price,
            duration_days: item.duration_days || 30,
            features: item.features || [],
            limits: {
              daily_ai_queries: item.limits?.ai_queries_per_day ?? item.limits?.daily_ai_queries ?? 5,
              max_training_plans: item.limits?.training_plans ?? item.limits?.max_training_plans ?? 3,
              dag_template_count: item.limits?.dag_template_count ?? 2,
              advanced_features: item.limits?.advanced_features ?? false
            },
            is_active: item.is_active ?? true,
            popular: item.popular ?? (item.slug === 'warmheart'), // 暖心会员标记为热门
            discount_percent: item.discount_percent
          }))
        } else {
          tiers.value = []
        }
      }
      return { success: true }
    } catch (err: any) {
      console.error('获取会员等级失败:', err)
      return { success: false, message: err.message }
    }
  }

  /**
   * 检查权限
   */
  async function checkUserPermission(permission: string): Promise<{
    allowed: boolean
    reason?: string
    upgradeRequired?: boolean
  }> {
    try {
      const response = await checkPermission(permission)
      if (response.code === 200 && response.data) {
        return {
          allowed: response.data.allowed,
          reason: response.data.reason,
          upgradeRequired: response.data.upgrade_required
        }
      }
      return { allowed: false, reason: '权限检查失败' }
    } catch (err: any) {
      console.error('权限检查失败:', err)
      return { allowed: false, reason: err.message }
    }
  }

  /**
   * 创建支付订单
   */
  async function createOrder(tierId: number, paymentMethod: 'wechat' | 'alipay'): Promise<{
    success: boolean
    order?: PaymentOrder
    message?: string
  }> {
    try {
      paymentLoading.value = true
      error.value = null
      
      const response = await createPaymentOrder({
        tier_id: tierId,
        payment_method: paymentMethod
      })
      
      if (response.code === 200 && response.data) {
        currentOrder.value = response.data
        return { success: true, order: response.data }
      }
      
      return { success: false, message: response.msg || '创建订单失败' }
    } catch (err: any) {
      console.error('创建支付订单失败:', err)
      error.value = err.message || '创建订单失败'
      return { success: false, message: error.value }
    } finally {
      paymentLoading.value = false
    }
  }

  /**
   * 查询支付状态
   */
  async function checkOrderStatus(orderNo: string): Promise<{
    success: boolean
    status?: PaymentOrder['status']
    message?: string
  }> {
    try {
      const response = await getPaymentStatus(orderNo)
      if (response.code === 200 && response.data) {
        currentOrder.value = response.data
        return { success: true, status: response.data.status }
      }
      return { success: false, message: response.msg || '查询失败' }
    } catch (err: any) {
      console.error('查询支付状态失败:', err)
      return { success: false, message: err.message }
    }
  }

  /**
   * 开始轮询支付状态
   */
  let pollingTimer: ReturnType<typeof setInterval> | null = null
  
  function startPollingPaymentStatus(orderNo: string, onSuccess: () => void, onFailed: () => void) {
    if (pollingTimer) {
      clearInterval(pollingTimer)
    }
    
    paymentPolling.value = true
    let attempts = 0
    const maxAttempts = 60 // 最多轮询60次（5分钟）
    
    pollingTimer = setInterval(async () => {
      attempts++
      
      const result = await checkOrderStatus(orderNo)
      
      if (result.status === 'paid') {
        stopPollingPaymentStatus()
        await fetchMembership() // 刷新会员状态
        onSuccess()
      } else if (result.status === 'failed' || result.status === 'cancelled') {
        stopPollingPaymentStatus()
        onFailed()
      } else if (attempts >= maxAttempts) {
        stopPollingPaymentStatus()
        onFailed()
      }
    }, 5000) // 每5秒查询一次
  }

  function stopPollingPaymentStatus() {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
    paymentPolling.value = false
  }

  /**
   * 取消支付订单
   */
  async function cancelOrder(orderNo: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await cancelPaymentOrder(orderNo)
      if (response.code === 200) {
        currentOrder.value = null
        stopPollingPaymentStatus()
        return { success: true }
      }
      return { success: false, message: response.msg || '取消失败' }
    } catch (err: any) {
      console.error('取消订单失败:', err)
      return { success: false, message: err.message }
    }
  }

  /**
   * 获取收款码
   */
  async function getPaymentQRCodes(): Promise<{
    success: boolean
    data?: { wechat: string; alipay: string }
    error?: string
  }> {
    try {
      const response = await import('@/api/membership').then(m => m.getPaymentQRCodes())
      if (response.code === 200 && response.data) {
        return { success: true, data: response.data }
      }
      return { success: false, error: response.msg || '获取收款码失败' }
    } catch (err: any) {
      console.error('获取收款码失败:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * 上传支付截图
   */
  async function uploadPaymentProof(
    orderNo: string,
    file: File,
    payMethod: 'wechat' | 'alipay'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      paymentLoading.value = true
      const response = await import('@/api/membership').then(m => 
        m.uploadPaymentProof(orderNo, file, payMethod)
      )
      if (response.code === 200) {
        return { success: true }
      }
      return { success: false, error: response.msg || '上传失败' }
    } catch (err: any) {
      console.error('上传支付截图失败:', err)
      return { success: false, error: err.message }
    } finally {
      paymentLoading.value = false
    }
  }

  /**
   * 获取账单历史
   */
  async function fetchBillingHistory(page: number = 1): Promise<{ success: boolean; message?: string }> {
    try {
      billingLoading.value = true
      
      const response = await getPaymentHistory({ page, per_page: 10 })
      if (response.code === 200 && response.data) {
        // 后端返回 orders，前端期望 records，做兼容处理
        const orders = response.data.orders || response.data.records || []
        // 转换订单数据为账单记录格式
        billingRecords.value = orders.map((order: any) => ({
          id: order.id,
          order_no: order.order_no,
          membership_name: order.membership?.name || '未知套餐',
          amount: order.actual_amount || order.amount,
          payment_method: order.pay_method || 'wechat',
          status: order.status,
          created_at: order.created_at,
          paid_at: order.paid_at,
          duration_days: order.membership?.duration_days || 30
        }))
        billingTotal.value = response.data.total || orders.length
        billingPage.value = page
        return { success: true }
      }
      
      return { success: false, message: response.msg || '获取账单失败' }
    } catch (err: any) {
      console.error('获取账单历史失败:', err)
      return { success: false, message: err.message }
    } finally {
      billingLoading.value = false
    }
  }

  /**
   * 删除订单
   */
  async function deleteOrder(orderId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await import('@/api/membership').then(m => m.deleteOrder(orderId))
      if (response.code === 200) {
        // 从列表中移除
        billingRecords.value = billingRecords.value.filter(r => r.id !== orderId)
        billingTotal.value = Math.max(0, billingTotal.value - 1)
        return { success: true }
      }
      return { success: false, message: response.msg || '删除失败' }
    } catch (err: any) {
      console.error('删除订单失败:', err)
      return { success: false, message: err.message }
    }
  }

  /**
   * 切换自动续费
   */
  async function toggleAutoRenew(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = autoRenewEnabled.value 
        ? await cancelAutoRenew()
        : await enableAutoRenew()
      
      if (response.code === 200) {
        await fetchMembership() // 刷新会员状态
        return { success: true }
      }
      
      return { success: false, message: response.msg || '操作失败' }
    } catch (err: any) {
      console.error('切换自动续费失败:', err)
      return { success: false, message: err.message }
    }
  }

  /**
   * 清空会员信息（登出时调用）
   */
  function clearMembership() {
    membership.value = null
    currentOrder.value = null
    billingRecords.value = []
    stopPollingPaymentStatus()
    initialized.value = false
    // 保留配置，不清除 systemConfig
  }

  /**
   * 重新初始化（登录后调用）
   */
  async function reinit() {
    initialized.value = false
    await init()
  }

  return {
    // State
    membership,
    tiers,
    loading,
    error,
    currentOrder,
    paymentLoading,
    paymentPolling,
    billingRecords,
    billingTotal,
    billingPage,
    billingLoading,
    systemConfig,
    configLoaded,
    
    // Getters
    isSystemEnabled,
    showMembershipCenter,
    showPurchaseButton,
    showDonationSection,
    unifiedLimits,
    systemMessage,
    isVip,
    membershipName,
    remainingDays,
    isExpiringSoon,
    dailyAiQueryLimit,
    maxTrainingPlans,
    hasAdvancedFeatures,
    autoRenewEnabled,
    expiresAtFormatted,
    
    // Actions
    fetchConfig,
    init,
    fetchMembership,
    fetchTiers,
    checkUserPermission,
    createOrder,
    checkOrderStatus,
    startPollingPaymentStatus,
    stopPollingPaymentStatus,
    cancelOrder,
    getPaymentQRCodes,
    uploadPaymentProof,
    fetchBillingHistory,
    deleteOrder,
    toggleAutoRenew,
    clearMembership,
    reinit,
  }
})
