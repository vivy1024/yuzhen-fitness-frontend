# 认证系统API文档

**状态**: ✅ 已完成
**版本**: v2.0.0
**更新日期**: 2026-01-17

---

## 📋 概述

玉珍健身前端的认证系统已完全集成后端API，支持邮箱登录、手机号登录、用户注册、用户档案管理等功能。

### 核心特性

- ✅ **邮箱密码登录** - 支持记住我功能
- ✅ **手机号验证码登录** - 60秒倒计时
- ✅ **用户注册** - 密码强度检测
- ✅ **JWT Token管理** - 自动刷新机制
- ✅ **用户档案管理** - 获取和更新用户档案
- ✅ **FFMI历史记录** - 体脂率和肌肉量追踪
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

### 5. 手机绑定 (`src/api/phone-binding.ts`)

**API方法**:
- `getPhoneStatus()` - 获取手机号绑定状态
- `bindPhone(phone, code)` - 绑定手机号
- `unbindPhone(password)` - 解绑手机号
- `changePhone(newPhone, newCode, oldCode?)` - 更换手机号
- `sendBindCode(phone)` - 发送绑定验证码

### 6. 邮箱验证码 (`src/api/email.ts`)

**API方法**:
- `sendEmailCode(email, type)` - 发送邮箱验证码
- `verifyEmailCode(email, code)` - 验证邮箱验证码
- `emailLogin(email, code)` - 邮箱验证码登录
- `checkEmailExists(email)` - 检查邮箱是否已注册
- `resetPassword(params)` - 重置密码

---

## 📡 手机绑定API

### 1. 获取手机号绑定状态

**端点**: `GET /api/user/phone/status`

**认证**: 需要JWT Token

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "has_phone": true,
    "phone": "13800138000",
    "phone_verified": true,
    "phone_bound_at": "2026-01-15T10:00:00.000Z"
  }
}
```

---

### 2. 发送绑定验证码

**端点**: `POST /api/user/phone/send-bind-code`

**认证**: 需要JWT Token

**请求参数**:
```json
{
  "phone": "13800138000"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号（中国大陆格式） |

**响应示例**:
```json
{
  "code": 200,
  "msg": "验证码已发送",
  "data": {
    "expires_at": "2026-01-15T10:05:00.000Z"
  }
}
```

---

### 3. 绑定手机号

**端点**: `POST /api/user/phone/bind`

**认证**: 需要JWT Token

**请求参数**:
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |
| code | string | 是 | 验证码 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "绑定成功",
  "data": {
    "phone": "13800138000",
    "phone_verified": true,
    "phone_bound_at": "2026-01-15T10:00:00.000Z"
  }
}
```

---

### 4. 解绑手机号

**端点**: `POST /api/user/phone/unbind`

**认证**: 需要JWT Token

**说明**: 需要提供密码验证身份

**请求参数**:
```json
{
  "password": "your_password"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| password | string | 是 | 登录密码 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "解绑成功"
}
```

---

### 5. 更换手机号

**端点**: `POST /api/user/phone/change`

**认证**: 需要JWT Token

**说明**: 需要先验证新手机号的验证码，旧手机号可选验证

**请求参数**:
```json
{
  "new_phone": "13900139000",
  "new_code": "123456",
  "old_code": "654321"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| new_phone | string | 是 | 新手机号 |
| new_code | string | 是 | 新手机号验证码 |
| old_code | string | 否 | 旧手机号验证码（如有绑定） |

**响应示例**:
```json
{
  "code": 200,
  "msg": "更换成功",
  "data": {
    "phone": "13900139000",
    "phone_verified": true
  }
}
```

---

## 📡 短信验证码API

### 1. 发送手机验证码

**端点**: `POST /api/auth/sms/send`

**认证**: 不需要

**请求参数**:
```json
{
  "phone": "13800138000"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号（中国大陆格式） |

**响应示例**:
```json
{
  "code": 200,
  "msg": "验证码已发送",
  "data": {
    "expires_at": "2026-01-15T10:05:00.000Z"
  }
}
```

**常见错误码**:
| 错误码 | 说明 |
|-------|------|
| SMS_RATE_LIMITED | 发送过于频繁，请稍后再试 |
| INVALID_PHONE | 手机号格式不正确 |

---

### 2. 验证手机验证码

**端点**: `POST /api/auth/sms/verify`

**认证**: 不需要

**请求参数**:
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |
| code | string | 是 | 验证码 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "验证成功",
  "data": {
    "valid": true
  }
}
```

---

### 3. 手机号验证码登录

**端点**: `POST /api/auth/sms/login`

**认证**: 不需要

**请求参数**:
```json
{
  "phone": "13800138000",
  "code": "123456"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |
| code | string | 是 | 验证码 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "name": "张三",
      "email": "user@example.com",
      "phone": "13800138000"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

---

### 4. 检查手机号是否已注册

**端点**: `GET /api/auth/sms/check-phone`

**认证**: 不需要

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "检查成功",
  "data": {
    "exists": true,
    "registered": true
  }
}
```

---

## 📡 邮箱验证码API

### 1. 发送邮箱验证码

**端点**: `POST /api/auth/email/send`

**认证**: 不需要

**请求参数**:
```json
{
  "email": "user@example.com",
  "type": "login"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| type | string | 否 | 验证码类型：register(注册)、login(登录)、reset(重置密码)，默认login |

**响应示例**:
```json
{
  "code": 200,
  "msg": "验证码已发送",
  "data": {
    "expires_at": "2026-01-15T10:05:00.000Z",
    "wait_seconds": 60
  }
}
```

**常见错误码**:
| 错误码 | 说明 |
|-------|------|
| EMAIL_RATE_LIMITED | 发送过于频繁，请稍后再试 |
| EMAIL_NOT_FOUND | 邮箱未注册 |
| EMAIL_ALREADY_EXISTS | 邮箱已注册 |

---

### 2. 验证邮箱验证码

**端点**: `POST /api/auth/email/verify`

**认证**: 不需要

**请求参数**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| code | string | 是 | 验证码 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "验证成功",
  "data": {
    "valid": true,
    "verified": true
  }
}
```

---

### 3. 邮箱验证码登录

**端点**: `POST /api/auth/email/login`

**认证**: 不需要

**请求参数**:
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| code | string | 是 | 验证码 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "name": "张三",
      "email": "user@example.com"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_in": 3600
  }
}
```

---

### 4. 检查邮箱是否已注册

**端点**: `GET /api/auth/email/check`

**认证**: 不需要

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "检查成功",
  "data": {
    "exists": true,
    "verified": true
  }
}
```

---

### 5. 重置密码

**端点**: `POST /api/auth/email/reset-password`

**认证**: 不需要

**请求参数**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "password": "new_password123",
  "password_confirmation": "new_password123"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| code | string | 是 | 验证码 |
| password | string | 是 | 新密码（至少6位） |
| password_confirmation | string | 是 | 确认密码 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "密码重置成功",
  "data": {
    "success": true
  }
}
```

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

## 📡 用户档案API

### 1. 获取当前用户信息

**端点**: `GET /api/users/me`

**认证**: 需要JWT Token

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "name": "张三",
    "email": "user@example.com",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.jpg",
    "role": "user",
    "is_active": true,
    "created_at": "2026-01-01T10:00:00.000Z"
  }
}
```

---

### 2. 获取用户档案

**端点**: `GET /api/users/profile`

**认证**: 需要JWT Token

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取用户档案成功",
  "data": {
    "user_id": 1,
    "age": 25,
    "gender": "male",
    "height": 175,
    "weight": 70,
    "fitness_goal": "gain_muscle",
    "experience_level": "beginner",
    "training_frequency": 4,
    "available_equipment": ["barbell", "dumbbell", "bench"],
    "injuries": [],
    "preferences": {
      "workout_duration": 60,
      "preferred_time": "morning"
    },
    "updated_at": "2026-01-15T10:00:00.000Z"
  }
}
```

---

### 3. 更新用户档案

**端点**: `PUT /api/users/profile` 或 `POST /api/users/profile`

**认证**: 需要JWT Token

**说明**: 支持PUT和POST两种方法（兼容前端）

**请求参数**:
```json
{
  "age": 25,
  "gender": "male",
  "height": 175,
  "weight": 70,
  "fitness_goal": "gain_muscle",
  "experience_level": "beginner",
  "training_frequency": 4,
  "available_equipment": ["barbell", "dumbbell", "bench"],
  "injuries": ["knee"],
  "preferences": {
    "workout_duration": 60,
    "preferred_time": "morning"
  }
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| age | integer | 否 | 年龄 |
| gender | string | 否 | 性别：male, female |
| height | number | 否 | 身高（cm） |
| weight | number | 否 | 体重（kg） |
| fitness_goal | string | 否 | 健身目标：lose_weight, gain_muscle, maintain, improve_fitness |
| experience_level | string | 否 | 经验水平：beginner, intermediate, advanced |
| training_frequency | integer | 否 | 每周训练次数 |
| available_equipment | array | 否 | 可用器械列表 |
| injuries | array | 否 | 伤病列表 |
| preferences | object | 否 | 偏好设置 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "更新用户档案成功",
  "data": {
    "user_id": 1,
    "age": 25,
    "...": "..."
  }
}
```

---

### 4. 获取用户统计信息

**端点**: `GET /api/users/statistics`

**认证**: 需要JWT Token

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取统计信息成功",
  "data": {
    "total_workouts": 50,
    "total_exercises": 200,
    "total_volume": 15000,
    "current_streak": 7,
    "longest_streak": 14,
    "favorite_exercises": ["杠铃深蹲", "杠铃卧推"],
    "this_week": {
      "workouts": 3,
      "exercises": 24,
      "volume": 1200
    }
  }
}
```

---

### 5. 获取FFMI历史记录

**端点**: `GET /api/users/profile/ffmi-history`

**认证**: 需要JWT Token

**说明**: FFMI (Fat-Free Mass Index) 无脂体重指数，用于评估肌肉量

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取FFMI历史成功",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "date": "2026-01-15",
      "weight": 70,
      "body_fat_percentage": 15,
      "ffmi": 21.5,
      "lean_mass": 59.5,
      "notes": "训练第4周"
    },
    {
      "id": 2,
      "user_id": 1,
      "date": "2026-01-08",
      "weight": 69,
      "body_fat_percentage": 16,
      "ffmi": 20.8,
      "lean_mass": 58,
      "notes": "训练第3周"
    }
  ]
}
```

---

### 6. 保存FFMI历史记录

**端点**: `POST /api/users/profile/ffmi-history`

**认证**: 需要JWT Token

**请求参数**:
```json
{
  "date": "2026-01-15",
  "weight": 70,
  "body_fat_percentage": 15,
  "notes": "训练第4周"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 是 | 记录日期（YYYY-MM-DD） |
| weight | number | 是 | 体重（kg） |
| body_fat_percentage | number | 是 | 体脂率（%） |
| notes | string | 否 | 备注 |

**说明**: FFMI和瘦体重由后端自动计算

**FFMI计算公式**:
```
瘦体重 = 体重 × (1 - 体脂率/100)
FFMI = 瘦体重 / (身高/100)²
```

**响应示例**:
```json
{
  "code": 201,
  "msg": "保存FFMI记录成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "date": "2026-01-15",
    "weight": 70,
    "body_fat_percentage": 15,
    "ffmi": 21.5,
    "lean_mass": 59.5,
    "notes": "训练第4周"
  }
}
```

---

## 🎯 前端集成示例

### 获取和更新用户档案

```typescript
import api from '@/api/user'

// 获取用户档案
async function getUserProfile() {
  try {
    const response = await api.get('/users/profile')
    
    if (response.code === 200) {
      const profile = response.data
      console.log('用户档案:', profile)
      return profile
    }
  } catch (error) {
    console.error('获取失败:', error)
  }
}

// 更新用户档案
async function updateUserProfile(profileData: any) {
  try {
    const response = await api.put('/users/profile', profileData)
    
    if (response.code === 200) {
      showSuccess('档案更新成功')
      return response.data
    }
  } catch (error) {
    showError('更新失败')
  }
}
```

### FFMI追踪

```typescript
// 获取FFMI历史
async function getFFMIHistory() {
  try {
    const response = await api.get('/users/profile/ffmi-history')
    
    if (response.code === 200) {
      const history = response.data
      // 绘制FFMI趋势图
      renderFFMIChart(history)
    }
  } catch (error) {
    console.error('获取失败:', error)
  }
}

// 保存FFMI记录
async function saveFFMIRecord(data: {
  date: string
  weight: number
  body_fat_percentage: number
  notes?: string
}) {
  try {
    const response = await api.post('/users/profile/ffmi-history', data)
    
    if (response.code === 201) {
      showSuccess('记录保存成功')
      // 刷新历史记录
      await getFFMIHistory()
    }
  } catch (error) {
    showError('保存失败')
  }
}
```

---

## 📊 数据结构

### UserProfile（用户档案）

```typescript
interface UserProfile {
  user_id: number
  age?: number
  gender?: 'male' | 'female'
  height?: number              // cm
  weight?: number              // kg
  fitness_goal?: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_fitness'
  experience_level?: 'beginner' | 'intermediate' | 'advanced'
  training_frequency?: number  // 每周训练次数
  available_equipment?: string[]
  injuries?: string[]
  preferences?: {
    workout_duration?: number  // 分钟
    preferred_time?: string    // morning, afternoon, evening
    [key: string]: any
  }
  updated_at: string
}
```

### FFMIRecord（FFMI记录）

```typescript
interface FFMIRecord {
  id: number
  user_id: number
  date: string                 // YYYY-MM-DD
  weight: number               // kg
  body_fat_percentage: number  // %
  ffmi: number                 // 自动计算
  lean_mass: number            // kg，自动计算
  notes?: string
  created_at: string
}
```

---

## 📝 相关文档

- **API接口文档**: `yuzhen-backend/docs/API文档.md`
- **认证中间件**: `yuzhen-backend/app/Http/Middleware/Authenticate.php`
- **JWT配置**: `yuzhen-backend/config/jwt.php`
- **用户控制器**: `yuzhen-backend/app/Modules/User/Controllers/UserController.php`

---

## 📈 版本历史

### v2.0.0 (2026-01-17) - 用户档案API

**变更内容**:
- ✅ 添加用户档案管理API（获取、更新）
- ✅ 添加用户统计信息API
- ✅ 添加FFMI历史记录API（获取、保存）
- ✅ 提供完整的前端集成示例
- ✅ 说明FFMI计算公式

### v1.0.0 (2026-01-02) - 初始版本

**变更内容**:
- ✅ 邮箱密码登录
- ✅ 手机号验证码登录
- ✅ 用户注册
- ✅ JWT Token管理

---

**维护者**: 薛小川
**最后更新**: 2026-01-17
