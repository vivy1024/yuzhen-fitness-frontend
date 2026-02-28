# Progress Store

> 自动生成 | 对应源文件: stores/progress.ts

## 概述

Progress Store 负责管理用户健身进度追踪，包括：
1. 管理进度记录（体重、体脂、围度）
2. 管理健身目标
3. 提供趋势数据计算
4. 与 User Store 协同工作

支持服务端数据加载与本地缓存双重机制，确保离线可用。

## State

```typescript
// 加载状态
const loading = ref(false)
const error = ref('')

// 进度记录
const records = ref<ProgressRecord[]>([])
const recentRecords = ref<ProgressRecord[]>([])

// 目标
const goals = ref<FitnessGoal[]>([])
const activeGoals = ref<FitnessGoal[]>([])

// 趋势数据
const weightTrend = ref<WeightTrend[]>([])
const ffmiTrend = ref<FFMITrend[]>([])
const volumeTrend = ref<{ date: string; volume: number }[]>([])

// 日历数据
const calendarData = ref<TrainingCalendarDay[]>([])

// 统计数据
const stats = ref({
  totalVolume: 0,
  trainingDaysThisMonth: 0,
  trainingDaysLastMonth: 0,
  currentWeight: 0,
  weightChange: 0,
  currentBodyFat: undefined as number | undefined,
  bodyFatChange: undefined as number | undefined,
  currentFFMI: undefined as number | undefined,
  ffmiChange: undefined as number | undefined,
  totalRecords: 0,
})

// 同步状态
const lastSyncAt = ref<string | null>(null)
```

## Getters

```typescript
// 是否有进度数据
const hasData = computed(() => records.value.length > 0 || goals.value.length > 0)

// 最新体重记录
const latestWeight = computed(() => {
  if (weightTrend.value.length === 0) return null
  return weightTrend.value[weightTrend.value.length - 1]
})

// 体重变化（相比第一条记录）
const weightChangeFromStart = computed(() => {
  if (weightTrend.value.length < 2) return 0
  const first = weightTrend.value[0].weight
  const last = weightTrend.value[weightTrend.value.length - 1].weight
  return last - first
})
```

## Actions

### 初始化

```typescript
// 初始化进度数据（优先服务器，失败则用本地缓存）
async function init(): Promise<void>

// 从服务器加载进度数据
async function loadFromServer(): Promise<void>

// 从用户档案构建基础进度数据（当后端API不可用时）
function buildFromUserProfile(): void

// 从本地缓存加载
function loadFromLocal(): void

// 保存到本地缓存
function saveToLocal(): void
```

### 数据操作

```typescript
// 添加进度记录（同时更新用户档案的体重数据）
async function addRecord(data: CreateProgressRecordRequest): Promise<{ success: boolean; message: string }>

// 加载训练日历数据
async function loadCalendar(year: number, month: number): Promise<void>

// 加载目标列表
async function loadGoals(): Promise<void>
```

### 目标同步

```typescript
// 从用户档案同步体重目标（双向同步）
async function syncWeightGoalFromProfile(): Promise<void>

// 更新目标并同步到用户档案
async function updateGoalWithSync(
  goalId: number,
  data: { current_value?: number; target_value?: number; status?: 'active' | 'completed' | 'abandoned' }
): Promise<{ success: boolean; message: string }>
```

### 生命周期

```typescript
// 刷新所有数据
async function refresh(): Promise<void>

// 清除缓存
function clearCache(): void
```

## 使用示例

### 1. 初始化进度数据

```typescript
import { useProgressStore } from '@/stores/progress'

const progressStore = useProgressStore()

// 页面加载时初始化
onMounted(async () => {
  await progressStore.init()
})
```

### 2. 添加体重记录

```typescript
// 添加新的体重记录
async function addWeightRecord() {
  const result = await progressStore.addRecord({
    date: new Date().toISOString().split('T')[0],
    weight: 70.5,
    body_fat: 15.2,
    notes: '早上空腹体重'
  })

  if (result.success) {
    toast.success(result.message)
  }
}
```

### 3. 显示进度统计

```typescript
// 在组件中显示进度数据
<template>
  <div>
    <p>当前体重: {{ progressStore.stats.currentWeight }} kg</p>
    <p>体重变化: {{ progressStore.weightChangeFromStart }} kg</p>
    <p>体脂率: {{ progressStore.stats.currentBodyFat }}%</p>
    <p>FFMI: {{ progressStore.stats.currentFFMI }}</p>
    <p>训练天数: {{ progressStore.stats.trainingDaysThisMonth }} 天</p>
  </div>
</template>
```

### 4. 查看趋势图表

```typescript
// 获取趋势数据用于图表展示
const weightData = computed(() => progressStore.weightTrend)
const ffmiData = computed(() => progressStore.ffmiTrend)
const volumeData = computed(() => progressStore.volumeTrend)

// 最新体重
const currentWeight = computed(() => progressStore.latestWeight?.weight ?? 0)
```

### 5. 训练日历

```typescript
// 加载某月的训练日历
async function loadMonthCalendar(year: number, month: number) {
  await progressStore.loadCalendar(year, month)
  // calendarData 包含每天的训练信息
  console.log(progressStore.calendarData)
}
```

---

**维护者**: 薛小川
**最后更新**: 2026-01-06