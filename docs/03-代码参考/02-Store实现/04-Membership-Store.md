# Membership Store

> 自动生成 | 对应源文件: stores/membership.ts

## 概述

Membership Store 负责管理用户会员等级、权限、支付、账单历史等功能。支持会员系统配置开关、支付订单创建与轮询、JWT 权限解析、自动续费管理。提供完整的会员生命周期管理能力。

## State

| 状态 | 类型 | 说明 |
|------|------|------|
| `membership` | `ref<UserMembership \| null>` | 当前用户会员信息 |
| `tiers` | `ref<MembershipTier[]>` | 会员等级列表 |
| `loading` | `ref<boolean>` | 加载状态 |
| `error` | `ref<string \| null>` | 错误信息 |
| `initialized` | `ref<boolean>` | 是否已初始化 |
| `systemConfig` | `ref<MembershipConfig \| null>` | 会员系统配置 |
| `configLoaded` | `ref<boolean>` | 配置是否已加载 |
| `jwtTier` | `ref<string \| null>` | JWT中的会员等级 |
| `jwtPermissions` | `ref<string[]>` | JWT中的权限列表 |
| `currentOrder` | `ref<PaymentOrder \| null>` | 当前支付订单 |
| `paymentLoading` | `ref<boolean>` | 支付加载状态 |
| `paymentPolling` | `ref<boolean>` | 支付状态轮询中 |
| `billingRecords` | `ref<BillingRecord[]>` | 账单历史记录 |
| `billingTotal` | `ref<number>` | 账单总数 |
| `billingPage` | `ref<number>` | 账单页码 |
| `billingLoading` | `ref<boolean>` | 账单加载状态 |

## Getters

### 系统配置

| 计算属性 | 说明 |
|----------|------|
| `isSystemEnabled` | 会员系统是否启用 |
| `showMembershipCenter` | 是否显示会员中心 |
| `showPurchaseButton` | 是否显示购买按钮 |
| `showDonationSection` | 是否显示打赏区域 |
| `unifiedLimits` | 统一限制配置 |
| `systemMessage` | 系统提示消息 |

### 会员状态

| 计算属性 | 说明 |
|----------|------|
| `isVip` | 是否VIP会员（已激活且未过期） |
| `membershipName` | 会员类型名称 |
| `currentTier` | 当前会员等级（free/warmheart/energy） |
| `remainingDays` | 剩余天数 |
| `isExpiringSoon` | 是否即将过期（7天内） |

### 权限限制

| 计算属性 | 说明 |
|----------|------|
| `dailyAiQueryLimit` | 每日AI查询限制 |
| `maxTrainingPlans` | 最大训练计划数 |
| `hasAdvancedFeatures` | 是否有高级功能权限 |
| `autoRenewEnabled` | 是否开启自动续费 |

### 其他

| 计算属性 | 说明 |
|----------|------|
| `expiresAtFormatted` | 到期日期格式化（YYYY-MM-DD） |

## Actions

### 初始化

**fetchConfig()** - 获取会员系统配置
- 获取会员系统开关和限制配置
- 失败时使用默认配置（禁用会员系统）

**init()** - 初始化会员信息
- 先获取系统配置
- 再获取会员信息和等级列表

**reinit()** - 重新初始化

### 会员数据

**fetchMembership()** - 获取当前用户会员信息
**fetchTiers()** - 获取所有会员等级

### 权限检查

**checkUserPermission(permission)** - 检查用户权限
- 返回：allowed、reason、upgradeRequired

### 支付流程

**createOrder(tierId, paymentMethod)** - 创建支付订单
- paymentMethod: 'wechat' | 'alipay'

**checkOrderStatus(orderNo)** - 查询支付状态

**startPollingPaymentStatus(orderNo, onSuccess, onFailed)** - 开始轮询支付状态
- 每5秒查询一次，最多60次

**stopPollingPaymentStatus()** - 停止轮询

**cancelOrder(orderNo)** - 取消支付订单

### 支付凭证

**getPaymentQRCodes()** - 获取收款码
**uploadPaymentProof(orderNo, file, payMethod)** - 上传支付截图

### 账单管理

**fetchBillingHistory(page)** - 获取账单历史
- 分页获取，默认每页10条

**deleteOrder(orderId)** - 删除订单

### 自动续费

**toggleAutoRenew()** - 切换自动续费状态

### 权限刷新

**updatePermissionsFromJwt(payload)** - 从JWT更新权限
- 由 auth store 在 Token 刷新时调用

**refreshPermissions()** - 刷新权限
- 从服务器获取最新权限并刷新 Token

### 清理

**clearMembership()** - 清空会员信息（登出时调用）

## 使用示例

### 1. 检查会员状态

```typescript
import { useMembershipStore } from '@/stores/membership'

const membershipStore = useMembershipStore()

// 检查是否是VIP
if (membershipStore.isVip) {
  console.log('剩余天数:', membershipStore.remainingDays)
}

// 获取当前会员等级
const tier = membershipStore.currentTier // 'free' | 'warmheart' | 'energy'

// 检查权限
const result = await membershipStore.checkUserPermission('advanced_feature')
if (!result.allowed) {
  console.log('需要升级:', result.reason)
}
```

### 2. 购买会员

```typescript
// 创建支付订单
const result = await membershipStore.createOrder(tierId, 'wechat')

if (result.success && result.order) {
  const orderNo = result.order.order_no

  // 开始轮询支付状态
  membershipStore.startPollingPaymentStatus(
    orderNo,
    () => {
      console.log('支付成功！')
      // 刷新会员状态
      membershipStore.fetchMembership()
    },
    () => {
      console.log('支付失败或超时')
    }
  )
}
```

### 3. 查看账单历史

```typescript
// 获取账单
await membershipStore.fetchBillingHistory(1)

// 显示账单列表
membershipStore.billingRecords.forEach(record => {
  console.log(`${record.membership_name}: ¥${record.amount}`)
})
```