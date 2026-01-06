# 认证系统API文档

**状态**: ✅ 已完成
**版本**: v1.0.0
**更新日期**: 2026-01-02

---

## 📋 概述

玉珍健身前端的认证系统已完全集成后端API，支持邮箱登录、手机号登录、用户注册等功能。

### 核心特性

- ✅ **邮箱密码登录** - 支持记住我功能
- ✅ **手机号验证码登录** - 60秒倒计时
- ✅ **用户注册** - 密码强度检测
- ✅ **JWT Token管理** - 自动刷新机制
- ✅ **请求拦截器** - 自动添加Token
- ✅ **响应拦截器** - 统一错误处理

---

## 🔧 技术实现

### 1. API层 (`src/api/auth.ts`)

**基础配置**:
```typescript
const API_BASE_URL = 'http://localhost:8000/api'

// 请求拦截器 - 自动添加Token
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)
```

**API方法**:
- `login(credentials)` - 邮箱密码登录
- `register(data)` - 用户注册
- `refreshToken()` - 刷新Token
- `logout()` - 登出

### 2. Store层 (`src/stores/auth.ts`)

**状态管理**:
```typescript
const user = ref<UserInfo | null>(null)
const isAuthenticated = ref(false)
const loading = ref(false)
```

**核心方法**:
- `init()` - 初始化认证状态（从localStorage恢复）
- `login(credentials)` - 登录并保存Token
- `register(data)` - 注册并自动登录
- `logout()` - 登出并清除状态

**数据持久化**:
- `localStorage.setItem('access_token', token)`
- `localStorage.setItem('refresh_token', refreshToken)`
- `localStorage.setItem('user_info', JSON.stringify(user))`
- `localStorage.setItem('current_user_id', userId)`

### 3. Token管理 (`src/utils/token.ts`)

**核心功能**:
```typescript
setToken(token, refreshToken, expiresIn)  // 保存Token
getToken()                                 // 获取Token
clearToken()                               // 清除Token
isTokenExpired()                           // 检查是否过期
```

### 4. 短信验证码 (`src/api/sms.ts`)

**API方法**:
- `sendSmsCode(phone)` - 发送验证码
- `verifySmsCode(phone, code)` - 验证验证码
- `smsLogin(phone, code)` - 手机号登录
- `checkPhone(phone)` - 检查手机号是否注册

---

## 📱 页面实现

### 登录页面 (`src/views/auth/login.vue`)

**功能特性**:
1. **双登录模式**
   - 邮箱密码登录
   - 手机号验证码登录（60秒倒计时）

2. **社交登录按钮**
   - 微信登录（UI已实现，待对接）
   - QQ登录（UI已实现，待对接）

3. **表单验证**
   - 邮箱格式验证
   - 手机号格式验证（`/^1[3-9]\d{9}$/`）
   - 密码显示/隐藏切换

4. **用户体验**
   - 记住我功能
   - 忘记密码链接
   - 加载状态提示
   - Toast消息提示

### 注册页面 (`src/views/auth/register.vue`)

**功能特性**:
1. **表单字段**
   - 昵称（2-20个字符）
   - 邮箱地址
   - 密码（至少6位）
   - 确认密码

2. **密码强度检测**
   - 弱（红色）：长度≥6
   - 中（黄色）：长度≥10 或 包含大小写
   - 强（绿色）：长度≥10 + 大小写 + 数字 + 特殊字符

3. **实时验证**
   - 密码一致性检查
   - 用户协议勾选
   - 表单完整性验证

4. **注册成功**
   - 自动登录
   - 跳转到首页

---

## 🔐 认证流程

### 邮箱登录流程

```
用户输入邮箱密码
    ↓
调用 authStore.login()
    ↓
POST /api/auth/login
    ↓
后端验证并返回Token
    ↓
保存Token到localStorage
    ↓
保存用户信息到Store
    ↓
跳转到首页
```

### 手机号登录流程

```
用户输入手机号
    ↓
点击"获取验证码"
    ↓
POST /api/auth/sms/send
    ↓
用户输入验证码
    ↓
POST /api/auth/sms/login
    ↓
后端验证并返回Token
    ↓
保存Token和用户信息
    ↓
跳转到首页
```

### 注册流程

```
用户填写注册信息
    ↓
前端验证（密码强度、一致性）
    ↓
调用 authStore.register()
    ↓
POST /api/auth/register
    ↓
后端创建用户并返回Token
    ↓
自动登录（保存Token）
    ↓
跳转到首页
```

---

## 🔄 Token刷新机制

### 自动刷新策略

1. **Token过期检测**
   ```typescript
   function isTokenExpired(): boolean {
     const expiresAt = parseInt(localStorage.getItem('token_expires_at'))
     return Date.now() >= expiresAt
   }
   ```

2. **刷新Token**
   ```typescript
   async function refreshToken() {
     const response = await api.post('/auth/refresh')
     setToken(response.data.access_token, response.data.refresh_token)
   }
   ```

3. **响应拦截器处理401**
   - 检测到401错误
   - 尝试刷新Token
   - 重试原请求
   - 失败则跳转登录页

---

## 📊 数据结构

### 用户信息 (UserInfo)

```typescript
interface UserInfo {
  id: number
  name: string
  email: string
  phone?: string
  avatar?: string
  nickname?: string
}
```

### 登录凭证 (LoginCredentials)

```typescript
interface LoginCredentials {
  email: string
  password: string
  remember_me?: boolean
}
```

### 注册数据 (RegisterData)

```typescript
interface RegisterData {
  nickname: string
  email: string
  password: string
  password_confirmation: string
  phone?: string
  gender?: 'male' | 'female'
  age?: number
}
```

### 认证响应 (AuthResponse)

```typescript
interface AuthResponse {
  code: number
  msg: string
  data: {
    user: UserInfo
    access_token: string
    refresh_token?: string
    token_type: string
    expires_in: number
  }
}
```

---

## 🎯 后续优化方向

### 1. 社交登录对接
- [ ] 微信登录API对接
- [ ] QQ登录API对接
- [ ] 第三方授权流程

### 2. 安全增强
- [ ] 图形验证码（防止机器人）
- [ ] 登录设备管理
- [ ] 异常登录检测

### 3. 用户体验
- [ ] 生物识别登录（指纹/面容）
- [ ] 一键登录（运营商）
- [ ] 登录历史记录

### 4. Token管理
- [ ] Token自动刷新（响应拦截器）
- [ ] 多设备登录管理
- [ ] Token黑名单机制

---

## 📝 相关文档

- **API接口文档**: `yuzhen-backend/docs/API文档.md`
- **认证中间件**: `yuzhen-backend/app/Http/Middleware/Authenticate.php`
- **JWT配置**: `yuzhen-backend/config/jwt.php`

---

**维护者**: 薛小川
**最后更新**: 2026-01-02
