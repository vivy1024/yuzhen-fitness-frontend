# 进度追踪API文档

**状态**: ✅ 已完成
**版本**: v1.0.0
**更新日期**: 2026-01-17

---

## 📋 概述

进度追踪API提供用户健身进度的记录、查询和统计功能，包括体重、体脂、围度等身体数据的追踪。

### 核心特性

- **进度概览**：一站式查看所有进度数据
- **进度记录管理**：体重、体脂、围度等数据的CRUD
- **目标管理**：设定和追踪健身目标
- **训练日历**：可视化训练计划和完成情况
- **趋势分析**：体重和FFMI趋势图表

---

## 📡 API端点

### 1. 进度概览

**端点**: `GET /api/progress/overview`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "latest_weight": {
      "value": 75.5,
      "unit": "kg",
      "date": "2026-01-17",
      "change_7d": -0.5,
      "change_30d": -2.0
    },
    "latest_body_fat": {
      "value": 15.2,
      "unit": "%",
      "date": "2026-01-17",
      "change_7d": -0.3,
      "change_30d": -1.2
    },
    "latest_ffmi": {
      "value": 22.5,
      "date": "2026-01-17",
      "change_7d": 0.2,
      "change_30d": 0.8
    },
    "active_goals": [
      {
        "id": 1,
        "type": "weight",
        "target_value": 73.0,
        "current_value": 75.5,
        "progress": 50,
        "deadline": "2026-03-01"
      }
    ],
    "training_streak": {
      "current": 7,
      "longest": 15
    }
  }
}
```

### 2. 获取进度记录列表

**端点**: `GET /api/progress/records`
**认证**: 需要

**查询参数**:
- `type` (可选): `weight`, `body_fat`, `measurements`
- `start_date` (可选): 开始日期 (YYYY-MM-DD)
- `end_date` (可选): 结束日期 (YYYY-MM-DD)
- `page` (可选): 页码，默认1
- `per_page` (可选): 每页数量，默认15

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "type": "weight",
        "value": 75.5,
        "unit": "kg",
        "date": "2026-01-17",
        "note": "早晨空腹",
        "created_at": "2026-01-17 08:00:00"
      },
      {
        "id": 2,
        "type": "body_fat",
        "value": 15.2,
        "unit": "%",
        "date": "2026-01-17",
        "note": "体脂秤测量",
        "created_at": "2026-01-17 08:05:00"
      }
    ],
    "total": 50,
    "per_page": 15
  }
}
```

### 3. 创建进度记录

**端点**: `POST /api/progress/records`
**认证**: 需要

**请求参数**:
```json
{
  "type": "weight",
  "value": 75.5,
  "unit": "kg",
  "date": "2026-01-17",
  "note": "早晨空腹"
}
```

**支持的记录类型**:
- `weight`: 体重（kg）
- `body_fat`: 体脂率（%）
- `chest`: 胸围（cm）
- `waist`: 腰围（cm）
- `hip`: 臀围（cm）
- `arm`: 臂围（cm）
- `thigh`: 腿围（cm）
- `calf`: 小腿围（cm）

**响应示例**:
```json
{
  "code": 200,
  "msg": "记录创建成功",
  "data": {
    "id": 1,
    "type": "weight",
    "value": 75.5,
    "unit": "kg",
    "date": "2026-01-17",
    "note": "早晨空腹",
    "created_at": "2026-01-17 08:00:00"
  }
}
```

### 4. 获取进度记录详情

**端点**: `GET /api/progress/records/{id}`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "type": "weight",
    "value": 75.5,
    "unit": "kg",
    "date": "2026-01-17",
    "note": "早晨空腹",
    "created_at": "2026-01-17 08:00:00",
    "updated_at": "2026-01-17 08:00:00"
  }
}
```

### 5. 更新进度记录

**端点**: `PUT /api/progress/records/{id}`
**认证**: 需要

**请求参数**:
```json
{
  "value": 75.3,
  "note": "早晨空腹（修正）"
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "记录更新成功",
  "data": {
    "id": 1,
    "type": "weight",
    "value": 75.3,
    "unit": "kg",
    "date": "2026-01-17",
    "note": "早晨空腹（修正）",
    "updated_at": "2026-01-17 09:00:00"
  }
}
```

### 6. 删除进度记录

**端点**: `DELETE /api/progress/records/{id}`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "记录已删除",
  "data": null
}
```

### 7. 获取目标列表

**端点**: `GET /api/progress/goals`
**认证**: 需要

**查询参数**:
- `status` (可选): `active`, `completed`, `expired`

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "type": "weight",
      "target_value": 73.0,
      "current_value": 75.5,
      "unit": "kg",
      "progress": 50,
      "status": "active",
      "deadline": "2026-03-01",
      "created_at": "2026-01-01"
    },
    {
      "id": 2,
      "type": "body_fat",
      "target_value": 12.0,
      "current_value": 15.2,
      "unit": "%",
      "progress": 40,
      "status": "active",
      "deadline": "2026-06-01",
      "created_at": "2026-01-01"
    }
  ]
}
```

### 8. 创建目标

**端点**: `POST /api/progress/goals`
**认证**: 需要

**请求参数**:
```json
{
  "type": "weight",
  "target_value": 73.0,
  "deadline": "2026-03-01",
  "note": "减脂目标"
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "目标创建成功",
  "data": {
    "id": 1,
    "type": "weight",
    "target_value": 73.0,
    "current_value": 75.5,
    "progress": 50,
    "deadline": "2026-03-01",
    "note": "减脂目标",
    "created_at": "2026-01-17"
  }
}
```

### 9. 更新目标

**端点**: `PUT /api/progress/goals/{id}`
**认证**: 需要

**请求参数**:
```json
{
  "target_value": 72.0,
  "deadline": "2026-04-01"
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "目标更新成功",
  "data": {
    "id": 1,
    "type": "weight",
    "target_value": 72.0,
    "deadline": "2026-04-01",
    "updated_at": "2026-01-17"
  }
}
```

### 10. 删除目标

**端点**: `DELETE /api/progress/goals/{id}`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "目标已删除",
  "data": null
}
```

### 11. 获取训练日历

**端点**: `GET /api/progress/calendar`
**认证**: 需要

**查询参数**:
- `year` (必需): 年份
- `month` (必需): 月份

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "year": 2026,
    "month": 1,
    "days": [
      {
        "date": "2026-01-17",
        "has_training": true,
        "training_count": 2,
        "has_progress_record": true
      },
      {
        "date": "2026-01-16",
        "has_training": true,
        "training_count": 1,
        "has_progress_record": false
      }
    ],
    "summary": {
      "total_training_days": 15,
      "total_trainings": 25,
      "total_progress_records": 10
    }
  }
}
```

### 12. 获取体重趋势

**端点**: `GET /api/progress/trends/weight`
**认证**: 需要

**查询参数**:
- `days` (可选): 统计天数，默认30

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "period_days": 30,
    "data_points": [
      {
        "date": "2026-01-17",
        "value": 75.5
      },
      {
        "date": "2026-01-16",
        "value": 75.8
      }
    ],
    "statistics": {
      "min": 75.0,
      "max": 77.5,
      "average": 76.2,
      "change": -2.0,
      "change_percentage": -2.6
    }
  }
}
```

### 13. 获取FFMI趋势

**端点**: `GET /api/progress/trends/ffmi`
**认证**: 需要

**查询参数**:
- `days` (可选): 统计天数，默认30

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "period_days": 30,
    "data_points": [
      {
        "date": "2026-01-17",
        "value": 22.5
      },
      {
        "date": "2026-01-16",
        "value": 22.3
      }
    ],
    "statistics": {
      "min": 21.8,
      "max": 22.5,
      "average": 22.1,
      "change": 0.7,
      "change_percentage": 3.2
    }
  }
}
```

---

## 🔄 工作流程

### 记录进度流程

```
1. 用户测量身体数据（体重、体脂等）
   └─> 前端调用 POST /api/progress/records
   
2. 创建进度记录
   └─> 后端保存到progress_records表
   
3. 刷新进度概览
   └─> 前端调用 GET /api/progress/overview
   
4. 更新趋势图表
   └─> 前端调用 GET /api/progress/trends/weight
```

### 目标管理流程

```
1. 用户设定健身目标
   └─> 前端调用 POST /api/progress/goals
   
2. 定期记录进度
   └─> 前端调用 POST /api/progress/records
   
3. 自动计算目标进度
   └─> 后端根据最新记录更新progress字段
   
4. 查看目标完成情况
   └─> 前端调用 GET /api/progress/goals
```

---

## 📊 数据结构

### 进度记录（progress_records）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 记录ID |
| user_id | int | 用户ID |
| type | string | 记录类型 |
| value | decimal | 数值 |
| unit | string | 单位 |
| date | date | 记录日期 |
| note | string | 备注 |
| created_at | datetime | 创建时间 |

### 目标（progress_goals）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 目标ID |
| user_id | int | 用户ID |
| type | string | 目标类型 |
| target_value | decimal | 目标值 |
| current_value | decimal | 当前值 |
| progress | int | 进度百分比 |
| status | enum | 状态 |
| deadline | date | 截止日期 |
| created_at | datetime | 创建时间 |

---

## 🎯 前端集成示例

### TypeScript类型定义

```typescript
// types/progress.ts
export interface ProgressRecord {
  id: number
  type: string
  value: number
  unit: string
  date: string
  note?: string
  created_at: string
}

export interface ProgressGoal {
  id: number
  type: string
  target_value: number
  current_value: number
  unit: string
  progress: number
  status: 'active' | 'completed' | 'expired'
  deadline: string
  note?: string
  created_at: string
}

export interface ProgressOverview {
  latest_weight: {
    value: number
    unit: string
    date: string
    change_7d: number
    change_30d: number
  }
  latest_body_fat: {
    value: number
    unit: string
    date: string
    change_7d: number
    change_30d: number
  }
  latest_ffmi: {
    value: number
    date: string
    change_7d: number
    change_30d: number
  }
  active_goals: ProgressGoal[]
  training_streak: {
    current: number
    longest: number
  }
}
```

### Composable示例

```typescript
// composables/useProgress.ts
import { ref } from 'vue'
import { apiClient } from '@/utils/api'

export function useProgress() {
  const overview = ref<ProgressOverview | null>(null)
  const records = ref<ProgressRecord[]>([])
  const goals = ref<ProgressGoal[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取进度概览
  const fetchOverview = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/progress/overview')
      overview.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建进度记录
  const createRecord = async (data: {
    type: string
    value: number
    unit: string
    date: string
    note?: string
  }) => {
    try {
      loading.value = true
      const response = await apiClient.post('/progress/records', data)
      // 刷新概览
      await fetchOverview()
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取进度记录列表
  const fetchRecords = async (params?: {
    type?: string
    start_date?: string
    end_date?: string
  }) => {
    try {
      loading.value = true
      const response = await apiClient.get('/progress/records', { params })
      records.value = response.data.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建目标
  const createGoal = async (data: {
    type: string
    target_value: number
    deadline: string
    note?: string
  }) => {
    try {
      loading.value = true
      const response = await apiClient.post('/progress/goals', data)
      // 刷新目标列表
      await fetchGoals()
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取目标列表
  const fetchGoals = async (status?: string) => {
    try {
      loading.value = true
      const params = status ? { status } : {}
      const response = await apiClient.get('/progress/goals', { params })
      goals.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    overview,
    records,
    goals,
    loading,
    error,
    fetchOverview,
    createRecord,
    fetchRecords,
    createGoal,
    fetchGoals
  }
}
```

### Vue组件示例

```vue
<template>
  <div class="progress-page">
    <!-- 进度概览 -->
    <Card>
      <CardHeader>
        <CardTitle>进度概览</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="metrics-grid">
          <div class="metric">
            <div class="label">体重</div>
            <div class="value">{{ overview?.latest_weight.value }} kg</div>
            <div class="change" :class="{ positive: overview?.latest_weight.change_30d < 0 }">
              {{ overview?.latest_weight.change_30d > 0 ? '+' : '' }}
              {{ overview?.latest_weight.change_30d }} kg (30天)
            </div>
          </div>
          
          <div class="metric">
            <div class="label">体脂率</div>
            <div class="value">{{ overview?.latest_body_fat.value }}%</div>
            <div class="change" :class="{ positive: overview?.latest_body_fat.change_30d < 0 }">
              {{ overview?.latest_body_fat.change_30d > 0 ? '+' : '' }}
              {{ overview?.latest_body_fat.change_30d }}% (30天)
            </div>
          </div>
          
          <div class="metric">
            <div class="label">FFMI</div>
            <div class="value">{{ overview?.latest_ffmi.value }}</div>
            <div class="change" :class="{ positive: overview?.latest_ffmi.change_30d > 0 }">
              {{ overview?.latest_ffmi.change_30d > 0 ? '+' : '' }}
              {{ overview?.latest_ffmi.change_30d }} (30天)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 添加记录按钮 -->
    <Button @click="showAddRecordDialog = true">
      <Plus class="w-4 h-4 mr-2" />
      添加记录
    </Button>

    <!-- 活跃目标 -->
    <Card v-if="overview?.active_goals.length">
      <CardHeader>
        <CardTitle>活跃目标</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-for="goal in overview.active_goals" :key="goal.id" class="goal-item">
          <div class="goal-header">
            <span class="goal-type">{{ goal.type }}</span>
            <span class="goal-deadline">{{ goal.deadline }}</span>
          </div>
          <Progress :value="goal.progress" />
          <div class="goal-stats">
            {{ goal.current_value }} / {{ goal.target_value }}
            ({{ goal.progress }}%)
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProgress } from '@/composables/useProgress'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus } from 'lucide-vue-next'

const { overview, fetchOverview } = useProgress()
const showAddRecordDialog = ref(false)

onMounted(async () => {
  await fetchOverview()
})
</script>
```

---

## 📝 相关文档

- [认证系统API](./01-认证系统API.md) - 用户档案和FFMI历史
- [训练日志API](./06-训练日志API.md) - 训练记录
- [个人最佳记录API](./07-个人最佳记录API.md) - 力量进步

---

## 📋 版本历史

### v1.0.0 (2026-01-17)
- 初始版本
- 文档化进度追踪所有API端点
- 提供完整的前端集成示例

---

**维护者**: 薛小川  
**最后更新**: 2026-01-17
