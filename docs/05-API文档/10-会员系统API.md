# 会员系统API文档

**状态**: ⚠️ 当前禁用（合规审查中）
**版本**: v1.0.0
**更新日期**: 2026-01-17

---

## ⚠️ 重要声明

**会员系统当前处于禁用状态**，原因如下：

1. **合规性审查**：需要确保符合《中华人民共和国电子商务法》和《网络交易监督管理办法》
2. **支付资质**：需要申请支付业务许可证或接入合规支付平台
3. **用户权益保护**：需要完善退款机制、服务协议、隐私政策
4. **税务合规**：需要建立完整的财务和税务管理体系

**当前替代方案**：
- 使用打赏奖励机制（`user_credits`表）
- 管理员手动添加额外次数
- 所有用户享受基础免费额度

**文档保留目的**：
- 记录技术实现方案
- 为未来合规上线做准备
- 提供API接口参考

---

## 📋 概述

会员系统提供分级会员服务，包括会员套餐管理、订单管理、权限检查等功能。

### 核心特性

- **三级会员体系**：免费版、基础版、专业版
- **灵活套餐**：月度、季度、年度订阅
- **订单管理**：创建、查询、取消、审核
- **权限控制**：基于会员等级的功能限制
- **支付方式**：收款码支付（需上传支付截图）

---

## 📡 API端点

### 1. 获取会员系统配置

**端点**: `GET /api/membership/config`
**认证**: 不需要
**说明**: 前端用于控制UI显示（当前返回 `enabled: false`）

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "enabled": false,
    "message": "会员系统当前禁用，等待合规审查"
  }
}
```

### 2. 获取所有会员等级

**端点**: `GET /api/membership/tiers`
**认证**: 不需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "免费版",
      "slug": "free",
      "description": "基础功能",
      "dag_daily_limit": 10,
      "agent_daily_limit": 5,
      "features": ["基础训练计划", "AI对话（限量）"]
    },
    {
      "id": 2,
      "name": "基础版",
      "slug": "basic",
      "description": "适合健身爱好者",
      "dag_daily_limit": 50,
      "agent_daily_limit": 20,
      "features": ["无限训练计划", "AI对话（增强）", "进度追踪"]
    },
    {
      "id": 3,
      "name": "专业版",
      "slug": "pro",
      "description": "专业健身教练",
      "dag_daily_limit": 200,
      "agent_daily_limit": 100,
      "features": ["所有功能", "优先支持", "专属教练"]
    }
  ]
}
```

### 3. 获取所有会员套餐

**端点**: `GET /api/membership/plans`
**认证**: 不需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "tier_id": 2,
      "tier_name": "基础版",
      "duration_days": 30,
      "duration_label": "月度",
      "price": 29.00,
      "original_price": 39.00,
      "discount_label": "限时优惠"
    },
    {
      "id": 2,
      "tier_id": 2,
      "tier_name": "基础版",
      "duration_days": 90,
      "duration_label": "季度",
      "price": 79.00,
      "original_price": 117.00,
      "discount_label": "省38元"
    }
  ]
}
```

### 4. 获取当前用户会员信息

**端点**: `GET /api/membership/current`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "tier": {
      "id": 1,
      "name": "免费版",
      "slug": "free"
    },
    "expires_at": null,
    "is_active": true,
    "days_remaining": null,
    "dag_daily_limit": 10,
    "agent_daily_limit": 5
  }
}
```

### 5. 检查权限

**端点**: `POST /api/membership/check-permission`
**认证**: 需要

**请求参数**:
```json
{
  "feature": "advanced_training_plan"
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "检查成功",
  "data": {
    "allowed": false,
    "message": "此功能需要基础版或更高会员",
    "required_tier": "basic",
    "current_tier": "free"
  }
}
```

### 6. 创建订单

**端点**: `POST /api/membership/orders`
**认证**: 需要

**请求参数**:
```json
{
  "plan_id": 1,
  "payment_method": "qrcode"
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "订单创建成功",
  "data": {
    "order_no": "ORD20260117123456",
    "plan_id": 1,
    "tier_name": "基础版",
    "duration_label": "月度",
    "amount": 29.00,
    "status": "pending",
    "payment_method": "qrcode",
    "created_at": "2026-01-17 12:34:56"
  }
}
```

### 7. 获取用户订单列表

**端点**: `GET /api/membership/orders`
**认证**: 需要

**查询参数**:
- `status` (可选): `pending`, `paid`, `cancelled`, `expired`
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
        "order_no": "ORD20260117123456",
        "tier_name": "基础版",
        "duration_label": "月度",
        "amount": 29.00,
        "status": "pending",
        "created_at": "2026-01-17 12:34:56"
      }
    ],
    "total": 1,
    "per_page": 15
  }
}
```

### 8. 查询订单详情

**端点**: `GET /api/membership/orders/{orderNo}`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "order_no": "ORD20260117123456",
    "user_id": 1,
    "plan_id": 1,
    "tier_name": "基础版",
    "duration_days": 30,
    "amount": 29.00,
    "status": "pending",
    "payment_method": "qrcode",
    "payment_proof_url": null,
    "paid_at": null,
    "created_at": "2026-01-17 12:34:56"
  }
}
```

### 9. 上传支付截图

**端点**: `POST /api/membership/orders/{orderNo}/upload-proof`
**认证**: 需要
**Content-Type**: `multipart/form-data`

**请求参数**:
- `proof_image`: 支付截图文件（图片格式）

**响应示例**:
```json
{
  "code": 200,
  "msg": "支付截图上传成功，等待审核",
  "data": {
    "order_no": "ORD20260117123456",
    "proof_url": "/storage/payment_proofs/xxx.jpg",
    "status": "pending"
  }
}
```

### 10. 取消订单

**端点**: `POST /api/membership/orders/{orderId}/cancel`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "订单已取消",
  "data": {
    "order_id": 1,
    "status": "cancelled"
  }
}
```

### 11. 删除订单

**端点**: `DELETE /api/membership/orders/{orderId}`
**认证**: 需要
**说明**: 仅待支付订单可删除

**响应示例**:
```json
{
  "code": 200,
  "msg": "订单已删除",
  "data": null
}
```

### 12. 获取收款码

**端点**: `GET /api/membership/payment-qrcodes`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "wechat": {
      "qrcode_url": "/storage/qrcodes/wechat.jpg",
      "account_name": "薛小川"
    },
    "alipay": {
      "qrcode_url": "/storage/qrcodes/alipay.jpg",
      "account_name": "薛小川"
    }
  }
}
```

---

## 🔄 工作流程

### 用户购买会员流程

```
1. 前端调用 GET /api/membership/config
   └─> 检查会员系统是否启用
   
2. 前端调用 GET /api/membership/plans
   └─> 展示可购买的会员套餐
   
3. 用户选择套餐，前端调用 POST /api/membership/orders
   └─> 创建订单，返回订单号
   
4. 前端调用 GET /api/membership/payment-qrcodes
   └─> 获取收款码，展示给用户
   
5. 用户扫码支付后，上传支付截图
   └─> POST /api/membership/orders/{orderNo}/upload-proof
   
6. 管理员审核订单
   └─> 审核通过后，用户会员等级自动升级
   
7. 前端调用 GET /api/membership/current
   └─> 刷新用户会员信息
```

### 权限检查流程

```
1. 用户尝试使用高级功能
   └─> 前端调用 POST /api/membership/check-permission
   
2. 后端检查用户会员等级
   └─> 返回是否允许使用
   
3. 如果不允许
   └─> 前端引导用户升级会员
```

---

## 📊 数据结构

### 会员等级（membership_tiers）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 等级ID |
| name | string | 等级名称 |
| slug | string | 等级标识 |
| description | string | 等级描述 |
| dag_daily_limit | int | DAG每日限额 |
| agent_daily_limit | int | Agent每日限额 |
| features | json | 功能列表 |

### 会员套餐（membership_plans）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 套餐ID |
| tier_id | int | 等级ID |
| duration_days | int | 有效天数 |
| duration_label | string | 时长标签 |
| price | decimal | 价格 |
| original_price | decimal | 原价 |

### 订单（membership_orders）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 订单ID |
| order_no | string | 订单号 |
| user_id | int | 用户ID |
| plan_id | int | 套餐ID |
| amount | decimal | 金额 |
| status | enum | 状态 |
| payment_method | string | 支付方式 |
| payment_proof_url | string | 支付截图 |
| paid_at | datetime | 支付时间 |

---

## 🎯 前端集成示例

### TypeScript类型定义

```typescript
// types/membership.ts
export interface MembershipTier {
  id: number
  name: string
  slug: string
  description: string
  dag_daily_limit: number
  agent_daily_limit: number
  features: string[]
}

export interface MembershipPlan {
  id: number
  tier_id: number
  tier_name: string
  duration_days: number
  duration_label: string
  price: number
  original_price: number
  discount_label?: string
}

export interface MembershipOrder {
  id: number
  order_no: string
  tier_name: string
  duration_label: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'expired'
  payment_method: string
  payment_proof_url?: string
  paid_at?: string
  created_at: string
}

export interface CurrentMembership {
  tier: {
    id: number
    name: string
    slug: string
  }
  expires_at: string | null
  is_active: boolean
  days_remaining: number | null
  dag_daily_limit: number
  agent_daily_limit: number
}
```

### Composable示例

```typescript
// composables/useMembership.ts
import { ref } from 'vue'
import { apiClient } from '@/utils/api'

export function useMembership() {
  const config = ref<{ enabled: boolean; message?: string } | null>(null)
  const tiers = ref<MembershipTier[]>([])
  const plans = ref<MembershipPlan[]>([])
  const current = ref<CurrentMembership | null>(null)
  const orders = ref<MembershipOrder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取会员系统配置
  const fetchConfig = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/membership/config')
      config.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取会员等级
  const fetchTiers = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/membership/tiers')
      tiers.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取会员套餐
  const fetchPlans = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/membership/plans')
      plans.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取当前会员信息
  const fetchCurrent = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/membership/current')
      current.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 检查权限
  const checkPermission = async (feature: string) => {
    try {
      const response = await apiClient.post('/membership/check-permission', { feature })
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  // 创建订单
  const createOrder = async (planId: number, paymentMethod: string = 'qrcode') => {
    try {
      loading.value = true
      const response = await apiClient.post('/membership/orders', {
        plan_id: planId,
        payment_method: paymentMethod
      })
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 上传支付截图
  const uploadPaymentProof = async (orderNo: string, file: File) => {
    try {
      loading.value = true
      const formData = new FormData()
      formData.append('proof_image', file)
      
      const response = await apiClient.post(
        `/membership/orders/${orderNo}/upload-proof`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取订单列表
  const fetchOrders = async (status?: string) => {
    try {
      loading.value = true
      const params = status ? { status } : {}
      const response = await apiClient.get('/membership/orders', { params })
      orders.value = response.data.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 取消订单
  const cancelOrder = async (orderId: number) => {
    try {
      loading.value = true
      const response = await apiClient.post(`/membership/orders/${orderId}/cancel`)
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    config,
    tiers,
    plans,
    current,
    orders,
    loading,
    error,
    fetchConfig,
    fetchTiers,
    fetchPlans,
    fetchCurrent,
    checkPermission,
    createOrder,
    uploadPaymentProof,
    fetchOrders,
    cancelOrder
  }
}
```

### Vue组件示例

```vue
<template>
  <div class="membership-page">
    <!-- 会员系统禁用提示 -->
    <Alert v-if="config && !config.enabled" variant="warning">
      <AlertTitle>会员系统暂时禁用</AlertTitle>
      <AlertDescription>{{ config.message }}</AlertDescription>
    </Alert>

    <!-- 会员套餐列表 -->
    <div v-else class="plans-grid">
      <Card v-for="plan in plans" :key="plan.id" class="plan-card">
        <CardHeader>
          <CardTitle>{{ plan.tier_name }}</CardTitle>
          <CardDescription>{{ plan.duration_label }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="price">
            <span class="current">¥{{ plan.price }}</span>
            <span v-if="plan.original_price" class="original">
              ¥{{ plan.original_price }}
            </span>
          </div>
          <Badge v-if="plan.discount_label">{{ plan.discount_label }}</Badge>
        </CardContent>
        <CardFooter>
          <Button @click="handlePurchase(plan.id)">立即购买</Button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMembership } from '@/composables/useMembership'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const { config, plans, fetchConfig, fetchPlans, createOrder } = useMembership()

onMounted(async () => {
  await fetchConfig()
  if (config.value?.enabled) {
    await fetchPlans()
  }
})

const handlePurchase = async (planId: number) => {
  try {
    const order = await createOrder(planId)
    // 跳转到支付页面
    router.push(`/membership/payment/${order.order_no}`)
  } catch (error) {
    console.error('创建订单失败:', error)
  }
}
</script>
```

---

## 📝 相关文档

- [用量管理API](./11-用量管理API.md) - 用量统计和限额管理
- [认证系统API](./01-认证系统API.md) - 用户认证和授权
- [管理后台API](./15-管理后台API.md) - 订单审核和管理

---

## 📋 版本历史

### v1.0.0 (2026-01-17)
- 初始版本
- 文档化会员系统所有API端点
- 添加合规声明和禁用说明
- 提供完整的前端集成示例

---

**维护者**: 薛小川  
**最后更新**: 2026-01-17
