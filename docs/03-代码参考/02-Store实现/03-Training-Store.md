# Training Store

> 自动生成 | 对应源文件: stores/training.ts

## 概述

Training Store 负责管理用户训练计划的完整生命周期，包括计划的获取、详情查看、激活、删除、导出、更新等操作。支持多维度筛选和排序，提供训练计划的状态分类（激活/已完成/归档）。

## State

| 状态 | 类型 | 说明 |
|------|------|------|
| `plans` | `ref<TrainingPlan[]>` | 训练计划列表 |
| `currentPlan` | `ref<TrainingPlanDetail \| null>` | 当前查看的计划详情 |
| `loading` | `ref<boolean>` | 加载状态 |
| `error` | `ref<string \| null>` | 错误信息 |
| `filters` | `ref<TrainingPlanFilters>` | 筛选条件 |

### TrainingPlanFilters 类型

```typescript
interface TrainingPlanFilters {
  status?: 'active' | 'completed' | 'all'
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all'
  goal?: string
  type?: 'manual' | 'ai_generated' | 'all'
  sortBy?: 'createdAt' | 'name' | 'frequency'
  sortOrder?: 'asc' | 'desc'
}
```

## Getters

| 计算属性 | 说明 |
|----------|------|
| `activePlans` | 激活的计划列表 |
| `completedPlans` | 已完成的计划列表 |
| `archivedPlans` | 归档的计划列表（非激活且未完成） |
| `activePlan` | 当前激活的计划（唯一） |
| `filteredPlans` | 应用筛选和排序后的计划列表 |

## Actions

### 数据获取

**fetchPlans(params?)** - 获取训练计划列表
- 参数支持：status、difficulty、goal
- 返回计划数组

**fetchPlanDetail(id)** - 获取计划详情
- 返回 TrainingPlanDetail

### 计划管理

**deletePlan(id)** - 删除训练计划
- 从列表中移除并清空当前计划

**activatePlan(id)** - 激活训练计划
- 设为当前唯一激活的计划

**startPlan(id)** - 开始训练计划
- 更新计划的开始时间

**updatePlan(id, data)** - 更新计划信息
- 支持更新：name、description、is_active

### 导出

**exportPlan(id, format)** - 导出计划
- format: 'json' | 'pdf'
- 返回下载 URL 和文件名

### 筛选

**setFilters(newFilters)** - 设置筛选条件
**resetFilters()** - 重置筛选条件

### 状态清理

**clearCurrentPlan()** - 清空当前计划
**clearState()** - 清空所有状态

## 使用示例

### 1. 获取并显示计划列表

```typescript
import { useTrainingStore } from '@/stores/training'

const trainingStore = useTrainingStore()

// 获取所有计划
const plans = await trainingStore.fetchPlans()

// 获取激活的计划
const activePlans = await trainingStore.fetchPlans({ status: 'active' })
```

### 2. 激活训练计划

```typescript
// 激活指定计划
await trainingStore.activatePlan(planId)

// 切换到另一个计划（会自动停用之前的）
await trainingStore.activatePlan(anotherPlanId)

// 当前激活的计划
console.log(trainingStore.activePlan)
```

### 3. 筛选和排序

```typescript
// 设置筛选条件
trainingStore.setFilters({
  status: 'active',
  difficulty: 'beginner',
  sortBy: 'createdAt',
  sortOrder: 'desc'
})

// 筛选后的列表已自动更新
const filtered = trainingStore.filteredPlans

// 重置筛选
trainingStore.resetFilters()
```