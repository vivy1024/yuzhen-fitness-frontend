# Credit Store

> 自动生成 | 对应源文件: stores/credit.ts

## 概述

Credit Store 负责管理用户积分体系，包括积分余额、流水历史、消耗统计等功能。积分是玉珍健身的核心货币，用于控制AI对话的使用量。

## State

```typescript
// 积分余额数据
const balance = ref<CreditBalance | null>(null)

// 流水历史数据
const transactions = ref<CreditTransaction[]>([])

// 流水分页信息
const transactionPage = ref(1)
const transactionTotal = ref(0)
const transactionLastPage = ref(1)

// 统计数据
const stats = ref<CreditStats | null>(null)

// 加载状态
const loading = ref(false)

// 错误信息
const error = ref<string | null>(null)

// 是否已初始化
const initialized = ref(false)

// 最后更新时间
const lastUpdated = ref<Date | null>(null)
```

## Getters

```typescript
// 每日配额
const dailyQuota = computed(() => balance.value?.daily_quota ?? 0)

// 今日已消耗
const dailyConsumed = computed(() => balance.value?.daily_consumed ?? 0)

// 剩余积分
const remaining = computed(() => balance.value?.remaining ?? 0)

// 总消耗积分
const totalConsumed = computed(() => balance.value?.total_consumed ?? 0)

// 会员等级
const membershipTier = computed(() => balance.value?.membership_tier ?? 'free')

// 是否MVP阶段
const isMvpPhase = computed(() => balance.value?.is_mvp_phase ?? false)

// 是否低余额警告
const hasLowBalanceWarning = computed(() => balance.value?.low_balance_warning ?? false)

// 最后重置日期
const lastResetDate = computed(() => balance.value?.last_reset ?? '')

// 使用进度百分比（0-100）
const usagePercent = computed(() => {
  if (!balance.value || balance.value.daily_quota === 0) return 0
  return Math.min(100, Math.round((balance.value.daily_consumed / balance.value.daily_quota) * 100))
})

// 是否积分耗尽
const isExhausted = computed(() => remaining.value <= 0)

// 是否可以发送查询
const canSendQuery = computed(() => remaining.value > 0)
```

## Actions

### 数据获取

```typescript
// 获取积分余额
async function fetchBalance(): Promise<{ success: boolean; message?: string }>

// 获取流水历史
async function fetchHistory(
  page: number = 1,
  mode?: 'dag' | 'agent'
): Promise<{ success: boolean; message?: string }>

// 获取消耗统计
async function fetchStats(days: number = 30): Promise<{ success: boolean; message?: string }>
```

### 数据更新

```typescript
// 本地更新积分消耗（对话完成后调用）
function updateAfterQuery(credits: number): void
```

### 生命周期

```typescript
// 初始化积分数据
async function init(): Promise<void>

// 刷新积分数据
async function refresh(): Promise<void>

// 清空积分数据（登出时调用）
function clearCredit(): void

// 重新初始化（登录后调用）
async function reinit(): Promise<void>
```

## 使用示例

### 1. 检查积分余额

```typescript
import { useCreditStore } from '@/stores/credit'

const creditStore = useCreditStore()

// 检查是否可以发送查询
if (creditStore.canSendQuery) {
  console.log(`剩余积分: ${creditStore.remaining}`)
  console.log(`使用进度: ${creditStore.usagePercent}%`)
} else {
  console.log('积分已耗尽，请充值')
}
```

### 2. 加载积分数据

```typescript
// 页面加载时初始化
onMounted(async () => {
  await creditStore.init()

  // 加载流水历史
  await creditStore.fetchHistory(1, 'dag')

  // 加载30天统计
  await creditStore.fetchStats(30)
})
```

### 3. 对话消耗积分

```typescript
// 对话完成后更新积分
async function handleMessageSent(creditsUsed: number) {
  // 本地更新积分消耗
  creditStore.updateAfterQuery(creditsUsed)

  // 检查是否需要警告
  if (creditStore.hasLowBalanceWarning) {
    toast.warning('积分余额不足，请及时充值')
  }
}
```

---

**维护者**: 薛小川
**最后更新**: 2026-02-05