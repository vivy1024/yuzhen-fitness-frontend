# Usage Store

> 自动生成 | 对应源文件: stores/usage.ts

## 概述

**状态**: 已废弃 (Deprecated)

Usage Store 是旧版用量状态管理，已被 `Credit Store` 替代。积分体系改造后，使用 `useCreditStore` 管理积分状态。

此文件保留仅供参考，请勿在新代码中使用。

## State

```typescript
// 今日用量数据
const todayUsage = ref<TodayUsage | null>(null)

// 额外额度数据
const credits = ref<UserCredits | null>(null)

// 用量历史数据
const history = ref<UsageHistory | null>(null)

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
// DAG剩余次数（每日配额 + 额外额度）
const dagRemaining = computed(() => { ... })

// Agent剩余次数（每日配额 + 额外额度）
const agentRemaining = computed(() => { ... })

// DAG今日已使用次数
const dagUsed = computed(() => todayUsage.value?.dag_used ?? 0)

// Agent今日已使用次数
const agentUsed = computed(() => todayUsage.value?.agent_used ?? 0)

// DAG每日限制
const dagLimit = computed(() => todayUsage.value?.dag_limit ?? 10)

// Agent每日限制
const agentLimit = computed(() => todayUsage.value?.agent_limit ?? 3)

// DAG额外额度
const dagCredits = computed(() => credits.value?.dag_credits ?? 0)

// Agent额外额度
const agentCredits = computed(() => credits.value?.agent_credits ?? 0)

// 总额外额度
const totalCredits = computed(() => credits.value?.total_credits ?? 0)

// 是否有低用量警告（剩余<=2次）
const hasLowUsageWarning = computed(() => {
  return dagRemaining.value <= 2 || agentRemaining.value <= 2
})

// DAG是否低用量警告
const isDagLow = computed(() => dagRemaining.value <= 2)

// Agent是否低用量警告
const isAgentLow = computed(() => agentRemaining.value <= 2)

// 是否已达DAG上限
const isDagLimitReached = computed(() => dagRemaining.value <= 0)

// 是否已达Agent上限
const isAgentLimitReached = computed(() => agentRemaining.value <= 0)

// 警告消息列表
const warnings = computed(() => todayUsage.value?.warnings ?? [])

// 当前日期
const currentDate = computed(() => todayUsage.value?.date ?? new Date().toISOString().split('T')[0])
```

## Actions

### 数据获取

```typescript
// 获取今日用量统计
async function fetchTodayUsage(): Promise<{ success: boolean; message?: string }>

// 获取额外额度余额
async function fetchCredits(): Promise<{ success: boolean; message?: string }>

// 检查是否可以执行查询
async function checkCanExecute(mode: 'dag' | 'agent'): Promise<UsageCheckResult>

// 增加用量计数
async function recordUsage(mode: 'dag' | 'agent'): Promise<UsageIncrementResult>

// 获取用量历史统计
async function fetchHistory(days: number = 30): Promise<{ success: boolean; message?: string }>
```

### 生命周期

```typescript
// 初始化用量数据
async function init(): Promise<void>

// 刷新用量数据
async function refresh(): Promise<void>

// 清空用量数据（登出时调用）
function clearUsage(): void

// 重新初始化（登录后调用）
async function reinit(): Promise<void>
```

## 使用示例

**注意**: 此 Store 已废弃，请使用 `Credit Store` 替代。

```typescript
// 旧代码（已废弃）
import { useUsageStore } from '@/stores/usage'

const usageStore = useUsageStore()

// 检查DAG是否可用
if (!usageStore.isDagLimitReached) {
  console.log(`DAG剩余: ${usageStore.dagRemaining} 次`)
}

// 新代码（推荐）
import { useCreditStore } from '@/stores/credit'

const creditStore = useCreditStore()

if (creditStore.canSendQuery) {
  console.log(`剩余积分: ${creditStore.remaining}`)
}
```

---

**维护者**: 薛小川
**最后更新**: 2026-02-05
**废弃说明**: 此 Store 已被 Credit Store 替代