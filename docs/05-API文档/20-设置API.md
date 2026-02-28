# 设置API

**状态**: 已完成
**版本**: v1.0.0
**更新日期**: 2026-02-28
**对应源文件**: `src/api/settings.ts`
**后端模块**: `app/Modules/User/Controllers/SettingsController.php`

---

## 概述

设置API提供用户个人设置管理、密码修改、账号管理等功能。支持主题切换、通知设置、密码修改和账号注销。

**核心功能**：
- 获取和更新用户设置
- 修改密码
- 退出登录
- 删除账号
- 缓存管理
- 获取应用版本信息

---

## 端点列表

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/settings | 获取用户设置 | 是 |
| PUT | /api/settings | 更新用户设置 | 是 |
| POST | /api/user/change-password | 修改密码 | 是 |
| DELETE | /api/user/account | 删除账号 | 是 |
| GET | /api/version | 获取应用版本信息 | 否 |

---

## 详细说明

### 1. 获取用户设置

获取当前用户的设置信息。

```http
GET /api/settings
```

**认证**: Bearer Token

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "theme": "system",
    "notifications": {
      "training": true,
      "nutrition": true,
      "system": true
    }
  }
}
```

---

### 2. 更新用户设置

更新用户的设置信息。

```http
PUT /api/settings
```

**认证**: Bearer Token

**请求参数**：
```typescript
{
  theme?: 'light' | 'dark' | 'system';  // 主题
  notifications?: {                      // 通知设置
    training?: boolean;                  // 训练通知
    nutrition?: boolean;                 // 营养通知
    system?: boolean;                    // 系统通知
  }
}
```

**请求示例**：
```json
{
  "theme": "dark",
  "notifications": {
    "training": true,
    "nutrition": false,
    "system": true
  }
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "theme": "dark",
    "notifications": {
      "training": true,
      "nutrition": false,
      "system": true
    }
  }
}
```

---

### 3. 修改密码

修改用户登录密码。

```http
POST /api/user/change-password
```

**认证**: Bearer Token

**请求参数**：
```typescript
{
  current_password: string;           // 当前密码
  new_password: string;                // 新密码
  new_password_confirmation: string;   // 确认新密码
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "message": "密码修改成功"
  }
}
```

---

### 4. 删除账号

注销用户账号，需要验证密码。

```http
DELETE /api/user/account
```

**认证**: Bearer Token

**请求参数**：
```typescript
{
  password: string;  // 账号密码（必填，用于验证身份）
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "message": "账号已注销"
  }
}
```

---

### 5. 退出登录

调用后端接口退出登录并清除本地token。

```http
POST /api/logout
```

**认证**: Bearer Token

**说明**: 此API导出自 `auth.ts` 模块

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": null
}
```

---

### 6. 获取缓存信息

获取本地存储（localStorage）的缓存信息。

```http
GET /api/cache/info
```

**认证**: 否

**说明**: 此接口为前端降级实现，读取 localStorage 大小

**响应示例**：
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "total_size": "2.5MB",
    "items": [
      { "name": "user_token", "size": "200B", "type": "localStorage" },
      { "name": "settings", "size": "1.2KB", "type": "localStorage" },
      { "name": "cache_data", "size": "2.3MB", "type": "localStorage" }
    ]
  }
}
```

---

### 7. 清除缓存

清除本地存储的缓存数据。

```http
POST /api/cache/clear
```

**认证**: 否

**说明**: 此接口为前端降级实现，清空 localStorage

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "message": "本地缓存已清除"
  }
}
```

---

### 8. 获取应用版本信息

获取前端应用和API的版本信息。

```http
GET /api/version
```

**认证**: 否

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "version": "1.6.4",
    "build": "2026022801",
    "api_version": "v2"
  }
}
```

---

## 数据结构

### AppSettings（应用设置）

```typescript
interface AppSettings {
  theme: 'light' | 'dark' | 'system';  // 主题
  notifications: {                       // 通知设置
    training: boolean;                  // 训练通知
    nutrition: boolean;                 // 营养通知
    system: boolean;                     // 系统通知
  };
}
```

### ChangePasswordRequest（修改密码请求）

```typescript
interface ChangePasswordRequest {
  current_password: string;              // 当前密码
  new_password: string;                  // 新密码
  new_password_confirmation: string;    // 确认新密码
}
```

### CacheInfo（缓存信息）

```typescript
interface CacheInfo {
  total_size: string;                   // 总大小
  items: Array<{                        // 缓存项
    name: string;
    size: string;
    type: string;
  }>;
}
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 401 | 未授权，请先登录 |
| 422 | 参数验证失败（密码不匹配等） |
| 500 | 服务器内部错误 |

---

## 前端集成示例

```typescript
// composables/useSettings.ts
import { ref } from 'vue'
import {
  getSettings,
  updateSettings,
  changePassword,
  deleteAccount,
  logout,
  getCacheInfo,
  clearCache,
  getAppVersion
} from '@/api/settings'

export function useSettings() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取设置
  const fetchSettings = async () => {
    loading.value = true
    try {
      const response = await getSettings()
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '获取设置失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 更新设置
  const saveSettings = async (settings: any) => {
    loading.value = true
    try {
      const response = await updateSettings(settings)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '保存设置失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 修改密码
  const updatePassword = async (data: {
    current_password: string
    new_password: string
    new_password_confirmation: string
  }) => {
    loading.value = true
    try {
      const response = await changePassword(data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '修改密码失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 注销账号
  const removeAccount = async (password: string) => {
    loading.value = true
    try {
      const response = await deleteAccount(password)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '注销账号失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchSettings,
    saveSettings,
    updatePassword,
    removeAccount,
    logout,
    getCacheInfo,
    clearCache,
    getAppVersion
  }
}
```

---

## 相关文档

- [认证系统API](./01-认证系统API.md) - 用户登录注册
- [通知API](./21-通知API.md) - 推送通知设置
- [会员系统API](./10-会员系统API.md) - 会员等级管理

---

## 版本历史

### v1.0.0 (2026-02-28)
- 初始版本
- 文档化8个设置相关API端点
- 说明主题、通知、密码、账号管理功能
- 说明缓存管理和版本信息功能