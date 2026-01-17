# 管理后台API文档

**状态**: ✅ 已完成
**版本**: v1.0.0
**更新日期**: 2026-01-17

---

## 📋 概述

管理后台API提供管理员专用的后台管理功能，包括订单审核、反馈管理、用户管理、监控指标等。

### 核心特性

- **订单管理**：审核会员订单、查看订单统计
- **反馈管理**：处理用户反馈、回复和状态更新
- **用户管理**：用户列表、角色管理、额外次数管理
- **会话管理**：三轨评分系统的专家评审
- **监控指标**：DAML-RAG服务监控、Prometheus查询
- **数据迁移**：临时数据迁移工具

---

## 🔐 认证要求

所有管理后台API都需要：
1. JWT认证（`jwt.auth` 中间件）
2. 管理员权限（`admin` 中间件）

**请求头**:
```http
Authorization: Bearer <admin_token>
```

---

## 📡 API端点

### 订单管理

#### 1. 获取订单统计

**端点**: `GET /api/admin/orders/stats`

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "total_orders": 150,
    "pending_orders": 5,
    "paid_orders": 120,
    "cancelled_orders": 25,
    "total_revenue": 4350.00,
    "today_orders": 3,
    "today_revenue": 87.00
  }
}
```

#### 2. 获取待审核订单

**端点**: `GET /api/admin/orders/pending`

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "order_no": "ORD20260117123456",
      "user_id": 10,
      "user_name": "张三",
      "tier_name": "基础版",
      "amount": 29.00,
      "payment_proof_url": "/storage/payment_proofs/xxx.jpg",
      "created_at": "2026-01-17 10:00:00"
    }
  ]
}
```

#### 3. 审核通过

**端点**: `POST /api/admin/orders/{id}/approve`

**响应示例**:
```json
{
  "code": 200,
  "msg": "订单已审核通过",
  "data": {
    "order_id": 1,
    "status": "paid",
    "user_membership_updated": true
  }
}
```

#### 4. 审核拒绝

**端点**: `POST /api/admin/orders/{id}/reject`

**请求参数**:
```json
{
  "reason": "支付截图不清晰"
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "订单已拒绝",
  "data": {
    "order_id": 1,
    "status": "rejected",
    "reason": "支付截图不清晰"
  }
}
```

### 反馈管理

#### 5. 获取反馈统计

**端点**: `GET /api/admin/feedback/stats`

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "total_feedback": 50,
    "pending": 5,
    "processing": 10,
    "resolved": 30,
    "closed": 5,
    "by_type": {
      "bug": 20,
      "feature": 15,
      "improvement": 10,
      "question": 5
    }
  }
}
```

#### 6. 获取所有反馈

**端点**: `GET /api/admin/feedback`

**查询参数**:
- `status` (可选): 状态筛选
- `type` (可选): 类型筛选
- `page` (可选): 页码

#### 7. 回复反馈

**端点**: `PUT /api/admin/feedback/{id}/reply`

**请求参数**:
```json
{
  "reply": "感谢反馈！这个问题已在v1.2.0版本中修复。"
}
```

#### 8. 更新反馈状态

**端点**: `PUT /api/admin/feedback/{id}/status`

**请求参数**:
```json
{
  "status": "resolved"
}
```

### 用户管理

#### 9. 获取用户列表

**端点**: `GET /api/admin/users`

**查询参数**:
- `search` (可选): 搜索关键词
- `role` (可选): 角色筛选
- `page` (可选): 页码

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
        "name": "张三",
        "email": "zhangsan@example.com",
        "role": "user",
        "membership_tier": "basic",
        "created_at": "2026-01-01"
      }
    ],
    "total": 100
  }
}
```

#### 10. 更新用户角色

**端点**: `PUT /api/admin/users/{id}/role`

**请求参数**:
```json
{
  "role": "admin"
}
```

#### 11. 添加额外次数

**端点**: `POST /api/admin/users/{userId}/credits`

**请求参数**:
```json
{
  "dag_credits": 50,
  "agent_credits": 20,
  "reason": "打赏奖励"
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "额外次数已添加",
  "data": {
    "user_id": 1,
    "dag_credits": 50,
    "agent_credits": 20,
    "total_dag_credits": 100,
    "total_agent_credits": 40
  }
}
```

### 会话管理

#### 12. 获取待评审会话

**端点**: `GET /api/admin/sessions/pending-review`

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "session_id": "sess_123",
      "user_id": 1,
      "user_name": "张三",
      "query": "如何增肌？",
      "response": "...",
      "created_at": "2026-01-17 10:00:00"
    }
  ]
}
```

### 监控指标

#### 13. DAML-RAG健康状态

**端点**: `GET /api/admin/metrics/daml-rag/health`

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "status": "healthy",
    "components": {
      "neo4j": "healthy",
      "qdrant": "healthy",
      "redis": "healthy",
      "mysql": "healthy"
    },
    "uptime": 86400,
    "version": "v2.0.0"
  }
}
```

#### 14. DAML-RAG系统指标

**端点**: `GET /api/admin/metrics/daml-rag/metrics`

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "total_queries": 1500,
    "avg_response_time": 2.5,
    "success_rate": 98.5,
    "cache_hit_rate": 75.0,
    "active_sessions": 10
  }
}
```

#### 15. 流式监控统计

**端点**: `GET /api/admin/metrics/daml-rag/streaming`

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "total_streaming_sessions": 500,
    "avg_streaming_time": 15.5,
    "avg_tokens_per_session": 250,
    "streaming_success_rate": 99.2
  }
}
```

---

## 🔄 工作流程

### 订单审核流程

```
1. 管理员登录后台
   └─> 前端调用 GET /api/admin/orders/pending
   
2. 查看待审核订单列表
   └─> 点击订单查看支付截图
   
3. 审核订单
   ├─> 通过：POST /api/admin/orders/{id}/approve
   └─> 拒绝：POST /api/admin/orders/{id}/reject
   
4. 系统自动更新用户会员等级（审核通过时）
```

### 反馈处理流程

```
1. 管理员查看待处理反馈
   └─> GET /api/admin/feedback?status=pending
   
2. 查看反馈详情
   └─> GET /api/admin/feedback/{id}
   
3. 回复反馈
   └─> PUT /api/admin/feedback/{id}/reply
   
4. 更新状态为已解决
   └─> PUT /api/admin/feedback/{id}/status
```

---

## 🎯 前端集成示例

### TypeScript类型定义

```typescript
// types/admin.ts
export interface OrderStats {
  total_orders: number
  pending_orders: number
  paid_orders: number
  cancelled_orders: number
  total_revenue: number
  today_orders: number
  today_revenue: number
}

export interface PendingOrder {
  id: number
  order_no: string
  user_id: number
  user_name: string
  tier_name: string
  amount: number
  payment_proof_url: string
  created_at: string
}

export interface FeedbackStats {
  total_feedback: number
  pending: number
  processing: number
  resolved: number
  closed: number
  by_type: Record<string, number>
}
```

### Composable示例

```typescript
// composables/useAdmin.ts
import { ref } from 'vue'
import { apiClient } from '@/utils/api'

export function useAdmin() {
  const orderStats = ref<OrderStats | null>(null)
  const pendingOrders = ref<PendingOrder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取订单统计
  const fetchOrderStats = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/admin/orders/stats')
      orderStats.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取待审核订单
  const fetchPendingOrders = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/admin/orders/pending')
      pendingOrders.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 审核通过
  const approveOrder = async (orderId: number) => {
    try {
      loading.value = true
      const response = await apiClient.post(`/admin/orders/${orderId}/approve`)
      // 刷新待审核列表
      await fetchPendingOrders()
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 审核拒绝
  const rejectOrder = async (orderId: number, reason: string) => {
    try {
      loading.value = true
      const response = await apiClient.post(`/admin/orders/${orderId}/reject`, { reason })
      // 刷新待审核列表
      await fetchPendingOrders()
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    orderStats,
    pendingOrders,
    loading,
    error,
    fetchOrderStats,
    fetchPendingOrders,
    approveOrder,
    rejectOrder
  }
}
```

---

## 📝 相关文档

- [会员系统API](./10-会员系统API.md) - 会员订单管理
- [用户反馈API](./13-用户反馈API.md) - 用户反馈功能
- [用量管理API](./11-用量管理API.md) - 用量统计

---

## 📋 版本历史

### v1.0.0 (2026-01-17)
- 初始版本
- 文档化管理后台所有API端点
- 提供完整的前端集成示例

---

**维护者**: 薛小川  
**最后更新**: 2026-01-17
