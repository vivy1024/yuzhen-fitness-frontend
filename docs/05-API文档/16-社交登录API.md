# 社交登录API文档

**状态**: 🚧 部分实现
**版本**: v1.0.0
**更新日期**: 2026-01-17

---

## 📋 概述

社交登录API提供第三方平台（微信、QQ、微博、GitHub）的OAuth登录和账号绑定功能。

### 核心特性

- **微信登录**：支持微信OAuth登录
- **账号绑定**：已登录用户可绑定社交账号
- **账号解绑**：解除社交账号绑定
- **多平台支持**：微信、QQ、微博、GitHub（部分待实现）

---

## ⚠️ 实现状态

| 平台 | 登录 | 绑定 | 解绑 | 状态 |
|------|------|------|------|------|
| 微信 | ✅ | ✅ | ✅ | 已实现 |
| QQ | ❌ | ❌ | ❌ | 待实现 |
| 微博 | ❌ | ❌ | ❌ | 待实现 |
| GitHub | ❌ | ❌ | ❌ | 待实现 |

---

## 📡 API端点

### 微信登录

#### 1. 发起微信登录

**端点**: `GET /api/social/login/wechat`
**认证**: 不需要

**说明**: 重定向到微信OAuth授权页面

**响应**: 302重定向到微信授权页面

#### 2. 微信登录回调

**端点**: `GET /api/social/callback/wechat`
**认证**: 不需要

**查询参数**:
- `code`: 微信授权码（由微信回调提供）
- `state`: 状态参数（防CSRF）

**响应示例**:
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "name": "张三",
      "email": "zhangsan@example.com",
      "avatar": "https://wx.qlogo.cn/..."
    }
  }
}
```

### 账号管理

#### 3. 查看已绑定的社交账号

**端点**: `GET /api/social/accounts`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "provider": "wechat",
      "provider_name": "微信",
      "provider_user_id": "oxxxxxx",
      "nickname": "张三",
      "avatar": "https://wx.qlogo.cn/...",
      "bound_at": "2026-01-15 10:00:00"
    }
  ]
}
```

#### 4. 绑定微信账号

**端点**: `POST /api/social/bind/wechat`
**认证**: 需要

**请求参数**:
```json
{
  "code": "微信授权码"
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "绑定成功",
  "data": {
    "provider": "wechat",
    "nickname": "张三",
    "avatar": "https://wx.qlogo.cn/..."
  }
}
```

#### 5. 解绑微信账号

**端点**: `DELETE /api/social/unbind/wechat`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "解绑成功",
  "data": null
}
```

---

## 🔄 工作流程

### 微信登录流程

```
1. 用户点击"微信登录"按钮
   └─> 前端跳转到 GET /api/social/login/wechat
   
2. 后端重定向到微信授权页面
   └─> 用户在微信页面授权
   
3. 微信回调到后端
   └─> GET /api/social/callback/wechat?code=xxx
   
4. 后端处理授权
   ├─> 获取微信用户信息
   ├─> 查找或创建本地用户
   └─> 生成JWT token
   
5. 后端重定向到前端
   └─> 前端获取token并保存
   
6. 登录成功
   └─> 前端跳转到首页
```

### 绑定微信账号流程

```
1. 已登录用户访问账号设置
   └─> 前端调用 GET /api/social/accounts
   └─> 展示已绑定的社交账号
   
2. 用户点击"绑定微信"
   └─> 前端跳转到微信授权页面
   
3. 用户授权后获取code
   └─> 前端调用 POST /api/social/bind/wechat
   
4. 绑定成功
   └─> 刷新社交账号列表
```

---

## 📊 数据结构

### 社交账号（social_accounts）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 记录ID |
| user_id | int | 用户ID |
| provider | string | 平台标识 |
| provider_user_id | string | 平台用户ID |
| nickname | string | 昵称 |
| avatar | string | 头像URL |
| access_token | string | 访问令牌 |
| refresh_token | string | 刷新令牌 |
| expires_at | datetime | 过期时间 |
| created_at | datetime | 创建时间 |

---

## 🎯 前端集成示例

### TypeScript类型定义

```typescript
// types/social.ts
export interface SocialAccount {
  id: number
  provider: 'wechat' | 'qq' | 'weibo' | 'github'
  provider_name: string
  provider_user_id: string
  nickname: string
  avatar: string
  bound_at: string
}

export interface SocialLoginResponse {
  token: string
  token_type: string
  expires_in: number
  user: {
    id: number
    name: string
    email: string
    avatar: string
  }
}
```

### Composable示例

```typescript
// composables/useSocial.ts
import { ref } from 'vue'
import { apiClient } from '@/utils/api'

export function useSocial() {
  const accounts = ref<SocialAccount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取已绑定的社交账号
  const fetchAccounts = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/social/accounts')
      accounts.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 发起微信登录
  const loginWithWechat = () => {
    // 直接跳转到后端登录接口
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/social/login/wechat`
  }

  // 绑定微信账号
  const bindWechat = async (code: string) => {
    try {
      loading.value = true
      const response = await apiClient.post('/social/bind/wechat', { code })
      // 刷新账号列表
      await fetchAccounts()
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 解绑微信账号
  const unbindWechat = async () => {
    try {
      loading.value = true
      const response = await apiClient.delete('/social/unbind/wechat')
      // 刷新账号列表
      await fetchAccounts()
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    loginWithWechat,
    bindWechat,
    unbindWechat
  }
}
```

### Vue组件示例

```vue
<template>
  <div class="social-login">
    <!-- 登录页面 -->
    <Button @click="handleWechatLogin" variant="outline">
      <WechatIcon class="w-5 h-5 mr-2" />
      微信登录
    </Button>

    <!-- 账号设置页面 -->
    <Card>
      <CardHeader>
        <CardTitle>社交账号绑定</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-for="account in accounts" :key="account.id" class="account-item">
          <img :src="account.avatar" class="avatar" />
          <div class="info">
            <div class="name">{{ account.nickname }}</div>
            <div class="provider">{{ account.provider_name }}</div>
          </div>
          <Button @click="handleUnbind(account.provider)" variant="destructive" size="sm">
            解绑
          </Button>
        </div>

        <Button v-if="!hasWechat" @click="handleBindWechat">
          <Plus class="w-4 h-4 mr-2" />
          绑定微信
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSocial } from '@/composables/useSocial'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-vue-next'

const { accounts, fetchAccounts, loginWithWechat, unbindWechat } = useSocial()

const hasWechat = computed(() => 
  accounts.value.some(acc => acc.provider === 'wechat')
)

onMounted(async () => {
  await fetchAccounts()
})

const handleWechatLogin = () => {
  loginWithWechat()
}

const handleBindWechat = () => {
  // 跳转到微信授权页面
  loginWithWechat()
}

const handleUnbind = async (provider: string) => {
  if (provider === 'wechat') {
    await unbindWechat()
  }
}
</script>
```

---

## 📝 相关文档

- [认证系统API](./01-认证系统API.md) - 邮箱和手机号登录

---

## 📋 版本历史

### v1.0.0 (2026-01-17)
- 初始版本
- 文档化微信登录API
- 标注其他平台待实现状态

---

**维护者**: 薛小川  
**最后更新**: 2026-01-17
