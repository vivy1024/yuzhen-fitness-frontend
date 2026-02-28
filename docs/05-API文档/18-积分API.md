# 积分API

**状态**: 已完成
**版本**: v1.0.0
**更新日期**: 2026-02-28
**对应源文件**: `src/api/credit.ts`
**后端模块**: `app/Modules/Credit/Controllers/CreditController.php`

---

## 概述

积分API提供用户积分余额查询、流水历史和消耗统计等功能。积分是玉珍健身的核心货币系统，用于AI对话服务。

**核心功能**：
- 查询积分余额和配额
- 获取积分消耗流水历史
- 统计积分消耗情况（按天/周/月）

**会员积分配额**：
| 等级 | 每日配额 |
|------|----------|
| free（免费用户） | 10 |
| warmheart（暖心会员） | 50 |
| energy（能量会员） | 200 |

---

## 端点列表

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/credits/balance | 获取积分余额 | 是 |
| GET | /api/credits/history | 获取积分流水历史 | 是 |
| GET | /api/credits/stats | 获取积分消耗统计 | 是 |

---

## 详细说明

### 1. 获取积分余额

获取用户当前的积分余额、配额和会员状态。

```http
GET /api/credits/balance
```

**认证**: Bearer Token

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "daily_quota": 200,
    "daily_consumed": 45,
    "remaining": 155,
    "total_consumed": 1250,
    "membership_tier": "energy",
    "is_mvp_phase": true,
    "low_balance_warning": false,
    "last_reset": "2026-02-28T00:00:00Z"
  }
}
```

**返回字段说明**：
| 字段 | 类型 | 说明 |
|------|------|------|
| daily_quota | number | 每日配额 |
| daily_consumed | number | 今日已消耗 |
| remaining | number | 剩余可用 |
| total_consumed | number | 累计已消耗 |
| membership_tier | string | 会员等级 |
| is_mvp_phase | boolean | 是否MVP阶段 |
| low_balance_warning | boolean | 低余额警告 |
| last_reset | string | 上次重置时间 |

---

### 2. 获取积分流水历史

获取积分消耗的详细记录，支持分页和模式筛选。

```http
GET /api/credits/history
```

**认证**: Bearer Token

**请求参数**（Query）：
```typescript
{
  page?: number;              // 页码，默认1
  per_page?: number;          // 每页数量，默认20
  mode?: 'dag' | 'agent';     // 筛选模式（可选）
}
```

**请求示例**：
```
GET /api/credits/history?page=1&per_page=20&mode=dag
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "transactions": [
      {
        "id": 1,
        "credits": 5,
        "tokens": 1200,
        "mode": "dag",
        "mode_label": "DAG对话",
        "template_name": "workout_plan",
        "conversation_id": "uuid-123",
        "input_tokens": 300,
        "output_tokens": 900,
        "description": "训练计划生成",
        "created_at": "2026-02-28T10:30:00Z"
      },
      {
        "id": 2,
        "credits": 15,
        "tokens": 3500,
        "mode": "agent",
        "mode_label": "Agent对话",
        "template_name": "nutrition_analysis",
        "conversation_id": "uuid-456",
        "input_tokens": 800,
        "output_tokens": 2700,
        "description": "营养分析",
        "created_at": "2026-02-28T09:15:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 95,
      "per_page": 20
    },
    "summary": {
      "today": 20,
      "this_week": 85,
      "this_month": 450
    }
  }
}
```

---

### 3. 获取积分消耗统计

获取积分消耗的统计数据，支持按天数统计。

```http
GET /api/credits/stats
```

**认证**: Bearer Token

**请求参数**（Query）：
```typescript
{
  days?: number;  // 统计天数，默认30天
}
```

**请求示例**：
```
GET /api/credits/stats?days=30
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "summary": {
      "today": 20,
      "this_week": 85,
      "this_month": 450
    },
    "by_mode": {
      "dag": {
        "count": 45,
        "credits": 180,
        "tokens": 42000
      },
      "agent": {
        "count": 18,
        "credits": 270,
        "tokens": 63000
      }
    },
    "by_template": [
      { "template_name": "workout_plan", "count": 25, "credits": 125 },
      { "template_name": "nutrition_analysis", "count": 15, "credits": 150 },
      { "template_name": "expert_review", "count": 10, "credits": 100 }
    ],
    "daily_trend": [
      { "date": "2026-02-28", "credits": 20, "count": 2 },
      { "date": "2026-02-27", "credits": 35, "count": 4 },
      { "date": "2026-02-26", "credits": 15, "count": 1 }
    ]
  }
}
```

---

## 数据结构

### CreditBalance（积分余额）

```typescript
interface CreditBalance {
  daily_quota: number;           // 每日配额
  daily_consumed: number;        // 今日已消耗
  remaining: number;             // 剩余可用
  total_consumed: number;       // 累计已消耗
  membership_tier: 'free' | 'warmheart' | 'energy';  // 会员等级
  is_mvp_phase: boolean;        // 是否MVP阶段
  low_balance_warning: boolean; // 低余额警告
  last_reset: string;            // 上次重置时间
}
```

### CreditTransaction（积分流水）

```typescript
interface CreditTransaction {
  id: number;
  credits: number;              // 消耗积分
  tokens: number;                // 使用Token数
  mode: 'dag' | 'agent';        // 对话模式
  mode_label: string;           // 模式标签
  template_name: string | null; // 使用的模板
  conversation_id: string | null;  // 对话ID
  input_tokens: number;         // 输入Token
  output_tokens: number;        // 输出Token
  description: string | null;   // 描述
  created_at: string;           // 创建时间
}
```

### CreditStats（积分统计）

```typescript
interface CreditStats {
  summary: {
    today: number;               // 今日消耗
    this_week: number;           // 本周消耗
    this_month: number;         // 本月消耗
  };
  by_mode: Record<string, { count: number; credits: number; tokens: number }>;
  by_template: Array<{ template_name: string; count: number; credits: number }>;
  daily_trend: Array<{ date: string; credits: number; count: number }>;
}
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 401 | 未授权，请先登录 |
| 404 | 用户不存在 |
| 500 | 服务器内部错误 |

---

## 前端集成示例

```typescript
// composables/useCredits.ts
import { ref } from 'vue'
import { getBalance, getHistory, getStats } from '@/api/credit'

export function useCredits() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchBalance = async () => {
    loading.value = true
    try {
      const response = await getBalance()
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '获取积分余额失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchHistory = async (page = 1, perPage = 20, mode?: 'dag' | 'agent') => {
    loading.value = true
    try {
      const response = await getHistory(page, perPage, mode)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '获取积分历史失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchStats = async (days = 30) => {
    loading.value = true
    try {
      const response = await getStats(days)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '获取积分统计失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchBalance,
    fetchHistory,
    fetchStats
  }
}
```

---

## 相关文档

- [会员系统API](./10-会员系统API.md) - 会员等级与配额
- [用量管理API](./11-用量管理API.md) - 每日用量追踪
- [AI聊天API](./04-AI聊天API.md) - 对话与积分消耗

---

## 版本历史

### v1.0.0 (2026-02-28)
- 初始版本
- 文档化3个积分API端点
- 说明积分余额、流水历史、统计数据结构
- 说明会员等级与每日配额对应关系