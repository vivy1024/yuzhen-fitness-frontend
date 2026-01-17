# 用户反馈API文档

**状态**: ✅ 已完成
**版本**: v1.0.0
**更新日期**: 2026-01-17

---

## 📋 概述

用户反馈API提供用户提交反馈、查看反馈列表、上传截图等功能。

### 核心特性

- **反馈提交**：支持文字描述和截图上传
- **反馈列表**：查看用户自己的反馈历史
- **反馈详情**：查看反馈的详细信息和回复
- **截图上传**：支持上传问题截图

---

## 📡 API端点

### 1. 获取用户反馈列表

**端点**: `GET /api/feedback`
**认证**: 需要

**查询参数**:
- `status` (可选): `pending`, `processing`, `resolved`, `closed`
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
        "type": "bug",
        "title": "训练计划无法保存",
        "content": "点击保存按钮后没有反应",
        "status": "processing",
        "priority": "high",
        "has_screenshot": true,
        "admin_reply": null,
        "created_at": "2026-01-17 10:00:00",
        "updated_at": "2026-01-17 10:00:00"
      }
    ],
    "total": 5,
    "per_page": 15
  }
}
```

### 2. 提交反馈

**端点**: `POST /api/feedback`
**认证**: 需要

**请求参数**:
```json
{
  "type": "bug",
  "title": "训练计划无法保存",
  "content": "点击保存按钮后没有反应，浏览器控制台显示网络错误",
  "screenshot_url": "/storage/feedback/screenshot_123.jpg",
  "contact_email": "user@example.com"
}
```

**反馈类型**:
- `bug`: Bug报告
- `feature`: 功能建议
- `improvement`: 改进建议
- `question`: 使用问题
- `other`: 其他

**响应示例**:
```json
{
  "code": 200,
  "msg": "反馈提交成功",
  "data": {
    "id": 1,
    "type": "bug",
    "title": "训练计划无法保存",
    "content": "点击保存按钮后没有反应，浏览器控制台显示网络错误",
    "status": "pending",
    "priority": "medium",
    "screenshot_url": "/storage/feedback/screenshot_123.jpg",
    "created_at": "2026-01-17 10:00:00"
  }
}
```

### 3. 获取反馈详情

**端点**: `GET /api/feedback/{id}`
**认证**: 需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "type": "bug",
    "title": "训练计划无法保存",
    "content": "点击保存按钮后没有反应，浏览器控制台显示网络错误",
    "status": "resolved",
    "priority": "high",
    "screenshot_url": "/storage/feedback/screenshot_123.jpg",
    "contact_email": "user@example.com",
    "admin_reply": "感谢反馈！这个问题已在v1.2.0版本中修复。",
    "admin_replied_at": "2026-01-17 15:00:00",
    "created_at": "2026-01-17 10:00:00",
    "updated_at": "2026-01-17 15:00:00"
  }
}
```

### 4. 上传截图

**端点**: `POST /api/feedback/upload`
**认证**: 需要
**Content-Type**: `multipart/form-data`

**请求参数**:
- `image`: 截图文件（图片格式）

**响应示例**:
```json
{
  "code": 200,
  "msg": "上传成功",
  "data": {
    "url": "/storage/feedback/screenshot_123.jpg",
    "filename": "screenshot_123.jpg",
    "size": 245678
  }
}
```

---

## 🔄 工作流程

### 用户提交反馈流程

```
1. 用户遇到问题或有建议
   └─> 前端打开反馈表单
   
2. 用户填写反馈信息
   ├─> 选择反馈类型
   ├─> 填写标题和描述
   └─> 可选：上传截图
   
3. 上传截图（如果有）
   └─> POST /api/feedback/upload
   └─> 获取截图URL
   
4. 提交反馈
   └─> POST /api/feedback
   └─> 包含截图URL
   
5. 查看反馈状态
   └─> GET /api/feedback
   └─> 查看处理进度和管理员回复
```

### 管理员处理流程

```
1. 管理员查看待处理反馈
   └─> GET /api/admin/feedback
   
2. 管理员回复反馈
   └─> PUT /api/admin/feedback/{id}/reply
   
3. 用户收到通知
   └─> 前端轮询或WebSocket推送
   
4. 用户查看回复
   └─> GET /api/feedback/{id}
```

---

## 📊 数据结构

### 反馈（feedback）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 反馈ID |
| user_id | int | 用户ID |
| type | enum | 反馈类型 |
| title | string | 标题 |
| content | text | 内容 |
| status | enum | 状态 |
| priority | enum | 优先级 |
| screenshot_url | string | 截图URL |
| contact_email | string | 联系邮箱 |
| admin_reply | text | 管理员回复 |
| admin_replied_at | datetime | 回复时间 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

---

## 🎯 前端集成示例

### TypeScript类型定义

```typescript
// types/feedback.ts
export interface Feedback {
  id: number
  type: 'bug' | 'feature' | 'improvement' | 'question' | 'other'
  title: string
  content: string
  status: 'pending' | 'processing' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  screenshot_url?: string
  contact_email?: string
  admin_reply?: string
  admin_replied_at?: string
  created_at: string
  updated_at: string
}

export interface FeedbackForm {
  type: string
  title: string
  content: string
  screenshot_url?: string
  contact_email?: string
}
```

### Composable示例

```typescript
// composables/useFeedback.ts
import { ref } from 'vue'
import { apiClient } from '@/utils/api'

export function useFeedback() {
  const feedbacks = ref<Feedback[]>([])
  const currentFeedback = ref<Feedback | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取反馈列表
  const fetchFeedbacks = async (status?: string) => {
    try {
      loading.value = true
      const params = status ? { status } : {}
      const response = await apiClient.get('/feedback', { params })
      feedbacks.value = response.data.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取反馈详情
  const fetchFeedback = async (id: number) => {
    try {
      loading.value = true
      const response = await apiClient.get(`/feedback/${id}`)
      currentFeedback.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 提交反馈
  const submitFeedback = async (data: FeedbackForm) => {
    try {
      loading.value = true
      const response = await apiClient.post('/feedback', data)
      // 刷新列表
      await fetchFeedbacks()
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 上传截图
  const uploadScreenshot = async (file: File) => {
    try {
      loading.value = true
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await apiClient.post('/feedback/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    feedbacks,
    currentFeedback,
    loading,
    error,
    fetchFeedbacks,
    fetchFeedback,
    submitFeedback,
    uploadScreenshot
  }
}
```

### Vue组件示例

```vue
<template>
  <div class="feedback-form">
    <Card>
      <CardHeader>
        <CardTitle>提交反馈</CardTitle>
        <CardDescription>告诉我们您的问题或建议</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit">
          <div class="form-field">
            <Label for="type">反馈类型</Label>
            <Select v-model="form.type">
              <SelectTrigger>
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug报告</SelectItem>
                <SelectItem value="feature">功能建议</SelectItem>
                <SelectItem value="improvement">改进建议</SelectItem>
                <SelectItem value="question">使用问题</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="form-field">
            <Label for="title">标题</Label>
            <Input
              id="title"
              v-model="form.title"
              placeholder="简要描述问题"
              required
            />
          </div>

          <div class="form-field">
            <Label for="content">详细描述</Label>
            <Textarea
              id="content"
              v-model="form.content"
              placeholder="请详细描述您遇到的问题或建议"
              rows="5"
              required
            />
          </div>

          <div class="form-field">
            <Label for="screenshot">截图（可选）</Label>
            <Input
              id="screenshot"
              type="file"
              accept="image/*"
              @change="handleFileChange"
            />
            <img v-if="screenshotPreview" :src="screenshotPreview" class="preview" />
          </div>

          <div class="form-field">
            <Label for="email">联系邮箱（可选）</Label>
            <Input
              id="email"
              v-model="form.contact_email"
              type="email"
              placeholder="用于接收回复通知"
            />
          </div>

          <Button type="submit" :disabled="loading">
            <Send class="w-4 h-4 mr-2" />
            提交反馈
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useFeedback } from '@/composables/useFeedback'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Send } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'

const { submitFeedback, uploadScreenshot, loading } = useFeedback()
const { toast } = useToast()

const form = reactive({
  type: 'bug',
  title: '',
  content: '',
  screenshot_url: '',
  contact_email: ''
})

const screenshotPreview = ref<string | null>(null)

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (file) {
    // 预览
    const reader = new FileReader()
    reader.onload = (e) => {
      screenshotPreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    
    // 上传
    try {
      const result = await uploadScreenshot(file)
      form.screenshot_url = result.url
    } catch (error) {
      console.error('上传失败:', error)
      toast({
        title: '上传失败',
        description: '截图上传失败，请重试',
        variant: 'destructive'
      })
    }
  }
}

const handleSubmit = async () => {
  try {
    await submitFeedback(form)
    toast({
      title: '提交成功',
      description: '感谢您的反馈！我们会尽快处理。'
    })
    // 重置表单
    Object.assign(form, {
      type: 'bug',
      title: '',
      content: '',
      screenshot_url: '',
      contact_email: ''
    })
    screenshotPreview.value = null
  } catch (error) {
    console.error('提交失败:', error)
    toast({
      title: '提交失败',
      description: '反馈提交失败，请重试',
      variant: 'destructive'
    })
  }
}
</script>
```

---

## 📝 相关文档

- [管理后台API](./15-管理后台API.md) - 反馈管理和回复
- [帮助中心API](./14-帮助中心API.md) - FAQ和帮助文档

---

## 📋 版本历史

### v1.0.0 (2026-01-17)
- 初始版本
- 文档化用户反馈所有API端点
- 提供完整的前端集成示例

---

**维护者**: 薛小川  
**最后更新**: 2026-01-17
