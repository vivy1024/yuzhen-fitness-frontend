# 用量管理API文档

**状态**: ✅ 已完成
**版本**: v1.0.0
**更新日期**: 2026-01-17

---

## 📋 概述

用量管理API提供用户每日查询次数的统计、限额检查和额外额度管理功能。

### 核心特性

- **每日限额管理**：基于会员等级的DAG和Agent查询限额
- **额外额度系统**：通过打赏奖励获得的额外查询次数
- **实时统计**：今日用量、剩余次数、历史统计
- **自动重置**：每日0点自动重置用量计数
- **透支保护**：用量达到限额后自动使用额外额度

---

## 📡 API端点

### 1. 获取今日用量统计

**端点**: `GET /api/usage/today`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "dag": {
      "used": 5,
      "limit": 10,
      "remaining": 5,
      "percentage": 50
    },
    "agent": {
      "used": 2,
      "limit": 5,
      "remaining": 3,
      "percentage": 40
    },
    "date": "2026-01-17",
    "reset_at": "2026-01-18 00:00:00"
  }
}
```

### 2. 获取额外额度余额

**端点**: `GET /api/usage/credits`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "dag_credits": 50,
    "agent_credits": 20,
    "total_credits": 70,
    "source": "打赏奖励",
    "last_updated": "2026-01-15 10:30:00"
  }
}
```

### 3. 检查是否可以执行查询

**端点**: `POST /api/usage/check`
**认证**: 需要

**请求参数**:
```json
{
  "mode": "dag"  // 或 "agent"
}
```

**响应示例（允许）**:
```json
{
  "code": 200,
  "msg": "检查成功",
  "data": {
    "allowed": true,
    "remaining": 5,
    "use_credits": false,
    "message": "今日剩余5次DAG查询"
  }
}
```

**响应示例（需要使用额外额度）**:
```json
{
  "code": 200,
  "msg": "检查成功",
  "data": {
    "allowed": true,
    "remaining": 0,
    "use_credits": true,
    "credits_remaining": 50,
    "message": "今日限额已用完，将使用额外额度（剩余50次）"
  }
}
```

**响应示例（不允许）**:
```json
{
  "code": 403,
  "msg": "今日限额已用完，且无额外额度",
  "data": {
    "allowed": false,
    "remaining": 0,
    "use_credits": false,
    "message": "请升级会员或等待明日重置"
  }
}
```

### 4. 增加用量计数

**端点**: `POST /api/usage/increment`
**认证**: 需要
**说明**: 通常由DAML-RAG服务调用，前端也可调用

**请求参数**:
```json
{
  "mode": "dag"  // 或 "agent"
}
```

**响应示例（使用每日限额）**:
```json
{
  "code": 200,
  "msg": "用量已增加",
  "data": {
    "success": true,
    "used_credits": false,
    "new_count": 6,
    "remaining": 4,
    "message": "今日DAG查询次数：6/10"
  }
}
```

**响应示例（使用额外额度）**:
```json
{
  "code": 200,
  "msg": "用量已增加（使用额外额度）",
  "data": {
    "success": true,
    "used_credits": true,
    "new_count": 10,
    "remaining": 0,
    "credits_remaining": 49,
    "message": "今日限额已用完，已使用1次额外额度（剩余49次）"
  }
}
```

### 5. 获取用量历史统计

**端点**: `GET /api/usage/history`
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
    "total_dag_queries": 150,
    "total_agent_queries": 60,
    "daily_stats": [
      {
        "date": "2026-01-17",
        "dag_count": 5,
        "agent_count": 2
      },
      {
        "date": "2026-01-16",
        "dag_count": 8,
        "agent_count": 3
      }
    ],
    "average": {
      "dag_per_day": 5.0,
      "agent_per_day": 2.0
    }
  }
}
```

---

## 🔄 工作流程

### 用户查询流程（前端）

```
1. 用户发起AI对话请求
   └─> 前端调用 POST /api/usage/check { mode: "dag" }
   
2. 检查是否允许查询
   ├─> 允许：继续发送AI请求
   └─> 不允许：提示用户升级会员或等待重置
   
3. AI请求完成后
   └─> 前端调用 POST /api/usage/increment { mode: "dag" }
   
4. 更新UI显示剩余次数
   └─> 前端调用 GET /api/usage/today
```

### DAML-RAG服务调用流程

```
1. DAML-RAG收到查询请求
   └─> 调用 POST /api/usage/check { mode: "dag" }
   
2. 检查是否允许查询
   ├─> 允许：执行查询
   └─> 不允许：返回403错误
   
3. 查询完成后
   └─> 调用 POST /api/usage/increment { mode: "dag" }
```

### 额外额度使用逻辑

```
1. 检查每日限额
   ├─> 未达到限额：使用每日限额
   └─> 已达到限额：检查额外额度
   
2. 检查额外额度
   ├─> 有额外额度：使用额外额度（user_credits表）
   └─> 无额外额度：拒绝查询
   
3. 扣减额外额度
   └─> UPDATE user_credits SET dag_credits = dag_credits - 1
```

---

## 📊 数据结构

### 用户额外额度（user_credits）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 记录ID |
| user_id | int | 用户ID |
| dag_credits | int | DAG额外次数 |
| agent_credits | int | Agent额外次数 |
| source | string | 来源（打赏奖励） |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### 每日用量（daily_usage）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 记录ID |
| user_id | int | 用户ID |
| date | date | 日期 |
| dag_count | int | DAG查询次数 |
| agent_count | int | Agent查询次数 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

---

## 🎯 前端集成示例

### TypeScript类型定义

```typescript
// types/usage.ts
export interface UsageToday {
  dag: {
    used: number
    limit: number
    remaining: number
    percentage: number
  }
  agent: {
    used: number
    limit: number
    remaining: number
    percentage: number
  }
  date: string
  reset_at: string
}

export interface UsageCredits {
  dag_credits: number
  agent_credits: number
  total_credits: number
  source: string
  last_updated: string
}

export interface UsageCheckResult {
  allowed: boolean
  remaining: number
  use_credits: boolean
  credits_remaining?: number
  message: string
}

export interface UsageHistory {
  period_days: number
  total_dag_queries: number
  total_agent_queries: number
  daily_stats: Array<{
    date: string
    dag_count: number
    agent_count: number
  }>
  average: {
    dag_per_day: number
    agent_per_day: number
  }
}
```

### Composable示例

```typescript
// composables/useUsage.ts
import { ref } from 'vue'
import { apiClient } from '@/utils/api'

export function useUsage() {
  const today = ref<UsageToday | null>(null)
  const credits = ref<UsageCredits | null>(null)
  const history = ref<UsageHistory | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取今日用量
  const fetchToday = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/usage/today')
      today.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取额外额度
  const fetchCredits = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/usage/credits')
      credits.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 检查是否可以查询
  const checkUsage = async (mode: 'dag' | 'agent'): Promise<UsageCheckResult> => {
    try {
      const response = await apiClient.post('/usage/check', { mode })
      return response.data.data
    } catch (err: any) {
      // 403错误表示不允许查询
      if (err.response?.status === 403) {
        return err.response.data.data
      }
      error.value = err.message
      throw err
    }
  }

  // 增加用量计数
  const incrementUsage = async (mode: 'dag' | 'agent') => {
    try {
      const response = await apiClient.post('/usage/increment', { mode })
      // 刷新今日用量
      await fetchToday()
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  // 获取用量历史
  const fetchHistory = async (days: number = 30) => {
    try {
      loading.value = true
      const response = await apiClient.get('/usage/history', { params: { days } })
      history.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    today,
    credits,
    history,
    loading,
    error,
    fetchToday,
    fetchCredits,
    checkUsage,
    incrementUsage,
    fetchHistory
  }
}
```

### Vue组件示例

```vue
<template>
  <div class="usage-dashboard">
    <!-- 今日用量卡片 -->
    <Card>
      <CardHeader>
        <CardTitle>今日用量</CardTitle>
        <CardDescription>{{ today?.date }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="usage-item">
          <div class="label">DAG查询</div>
          <Progress :value="today?.dag.percentage" />
          <div class="stats">
            {{ today?.dag.used }} / {{ today?.dag.limit }}
            <span class="remaining">(剩余 {{ today?.dag.remaining }})</span>
          </div>
        </div>
        
        <div class="usage-item">
          <div class="label">Agent查询</div>
          <Progress :value="today?.agent.percentage" />
          <div class="stats">
            {{ today?.agent.used }} / {{ today?.agent.limit }}
            <span class="remaining">(剩余 {{ today?.agent.remaining }})</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p class="text-sm text-muted-foreground">
          将于 {{ today?.reset_at }} 重置
        </p>
      </CardFooter>
    </Card>

    <!-- 额外额度卡片 -->
    <Card>
      <CardHeader>
        <CardTitle>额外额度</CardTitle>
        <CardDescription>{{ credits?.source }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="credits-grid">
          <div class="credit-item">
            <div class="value">{{ credits?.dag_credits }}</div>
            <div class="label">DAG额外次数</div>
          </div>
          <div class="credit-item">
            <div class="value">{{ credits?.agent_credits }}</div>
            <div class="label">Agent额外次数</div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUsage } from '@/composables/useUsage'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const { today, credits, fetchToday, fetchCredits } = useUsage()

onMounted(async () => {
  await Promise.all([
    fetchToday(),
    fetchCredits()
  ])
})
</script>
```

### AI对话前检查示例

```typescript
// 在发送AI请求前检查用量
const sendAIMessage = async (message: string) => {
  const { checkUsage, incrementUsage } = useUsage()
  
  // 1. 检查是否可以查询
  const checkResult = await checkUsage('dag')
  
  if (!checkResult.allowed) {
    // 提示用户升级会员或等待重置
    showUpgradeDialog(checkResult.message)
    return
  }
  
  // 2. 发送AI请求
  try {
    const response = await sendChatMessage(message)
    
    // 3. 增加用量计数
    await incrementUsage('dag')
    
    return response
  } catch (error) {
    console.error('AI请求失败:', error)
    throw error
  }
}
```

---

## 📝 相关文档

- [会员系统API](./10-会员系统API.md) - 会员等级和限额管理
- [AI聊天API](./04-AI聊天API.md) - AI对话功能
- [管理后台API](./15-管理后台API.md) - 用量统计和管理

---

## 📋 版本历史

### v1.0.0 (2026-01-17)
- 初始版本
- 文档化用量管理所有API端点
- 提供完整的前端集成示例
- 说明额外额度使用逻辑

---

**维护者**: 薛小川  
**最后更新**: 2026-01-17
