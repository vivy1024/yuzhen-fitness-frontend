# Auth Store

> 自动生成 | 对应源文件: stores/auth.ts

## 概述

Auth Store 负责管理用户认证状态，包括登录、注册、登出、Token刷新和用户信息管理。支持多种登录方式（账号密码、手机验证码），并集成了Token自动刷新和DAML-RAG预热功能。

## State

| 状态 | 类型 | 说明 |
|------|------|------|
| `user` | `ref<UserInfo \| null>` | 当前登录用户信息 |
| `isAuthenticated` | `ref<boolean>` | 是否已认证 |
| `loading` | `ref<boolean>` | 加载状态 |

### UserInfo 类型

```typescript
interface UserInfo {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  nickname?: string
  role?: string  // admin, user, expert
}
```

## Getters

| 计算属性 | 说明 |
|----------|------|
| `userName` | 用户显示名称（优先 nickname > name > email） |
| `userEmail` | 用户邮箱 |
| `userAvatar` | 用户头像 |
| `isAdmin` | 是否管理员 |

## Actions

### 初始化

**init()** - 初始化认证状态
- 从 localStorage 恢复用户信息
- 解析 JWT 中的权限 Claims
- 初始化关联的 stores

**initTokenManager()** - 初始化 Token 管理器
- 设置刷新 Token 的 API 函数
- 设置 Token 过期自动登出回调

**initRelatedStores()** - 初始化关联 stores
- 并行初始化：userStore、membershipStore、topicStore、usageStore

### 认证流程

**handleAuthSuccess(data)** - 认证成功统一处理
- 保存 Token 到 localStorage 和 TokenManager
- 保存用户信息
- 初始化关联 stores
- 解析 JWT 权限
- 预热 DAML-RAG

### 登录/注册

**login(credentials)** - 账号密码登录
**loginByPhone(phone, code)** - 手机验证码登录
**register(data)** - 邮箱注册
**registerByPhone(data)** - 手机号注册

### 登出

**logout()** - 登出
- 调用后端登出 API
- 清除 Token 和用户状态
- 重置关联 stores

### DAML-RAG

**warmupDamlRag(userId)** - 预热 AI 服务用户数据

## 使用示例

### 1. 登录并处理认证成功

```typescript
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 账号密码登录
const result = await authStore.login({
  email: 'user@example.com',
  password: 'password123'
})

if (result.success) {
  console.log('欢迎回来，', authStore.userName)
}
```

### 2. 检查认证状态

```typescript
// 在路由守卫中使用
const authStore = useAuthStore()

if (!authStore.isAuthenticated) {
  router.push('/login')
}

// 检查是否为管理员
if (authStore.isAdmin) {
  // 显示管理功能
}
```

### 3. 登出

```typescript
// 清除所有认证状态
await authStore.logout()
router.push('/login')
```