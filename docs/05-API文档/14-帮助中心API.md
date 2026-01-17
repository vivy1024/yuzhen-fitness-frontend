# 帮助中心API文档

**状态**: ✅ 已完成
**版本**: v1.0.0
**更新日期**: 2026-01-17

---

## 📋 概述

帮助中心API提供FAQ（常见问题）的查询和反馈功能。

### 核心特性

- **FAQ查询**：获取常见问题列表和详情
- **分类浏览**：按分类查看FAQ
- **FAQ反馈**：用户可以对FAQ的有用性进行反馈
- **公开访问**：无需认证即可查看

---

## 📡 API端点

### 1. 获取FAQ列表

**端点**: `GET /api/help/faqs`
**认证**: 不需要

**查询参数**:
- `category` (可选): 分类ID或slug
- `search` (可选): 搜索关键词
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
        "category_id": 1,
        "category_name": "账号相关",
        "title": "如何注册账号？",
        "summary": "玉珍健身支持邮箱和手机号两种注册方式",
        "helpful_count": 25,
        "not_helpful_count": 2,
        "view_count": 150,
        "created_at": "2026-01-01",
        "updated_at": "2026-01-10"
      },
      {
        "id": 2,
        "category_id": 1,
        "category_name": "账号相关",
        "title": "忘记密码怎么办？",
        "summary": "可以通过邮箱或手机号重置密码",
        "helpful_count": 18,
        "not_helpful_count": 1,
        "view_count": 120,
        "created_at": "2026-01-01",
        "updated_at": "2026-01-10"
      }
    ],
    "total": 25,
    "per_page": 15
  }
}
```

### 2. 获取FAQ详情

**端点**: `GET /api/help/faqs/{id}`
**认证**: 不需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": 1,
    "category_id": 1,
    "category_name": "账号相关",
    "title": "如何注册账号？",
    "summary": "玉珍健身支持邮箱和手机号两种注册方式",
    "content": "## 注册方式\n\n### 邮箱注册\n1. 点击注册按钮\n2. 输入邮箱地址\n3. 输入验证码\n4. 设置密码\n5. 完成注册\n\n### 手机号注册\n1. 点击注册按钮\n2. 输入手机号\n3. 输入短信验证码\n4. 设置密码\n5. 完成注册",
    "helpful_count": 25,
    "not_helpful_count": 2,
    "view_count": 150,
    "related_faqs": [
      {
        "id": 2,
        "title": "忘记密码怎么办？"
      },
      {
        "id": 3,
        "title": "如何修改个人信息？"
      }
    ],
    "created_at": "2026-01-01",
    "updated_at": "2026-01-10"
  }
}
```

### 3. 获取分类列表

**端点**: `GET /api/help/categories`
**认证**: 不需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "账号相关",
      "slug": "account",
      "description": "注册、登录、密码等问题",
      "icon": "user",
      "faq_count": 5,
      "sort_order": 1
    },
    {
      "id": 2,
      "name": "训练计划",
      "slug": "training",
      "description": "训练计划创建、导入、管理",
      "icon": "dumbbell",
      "faq_count": 8,
      "sort_order": 2
    },
    {
      "id": 3,
      "name": "AI对话",
      "slug": "ai-chat",
      "description": "AI健身教练使用指南",
      "icon": "message-circle",
      "faq_count": 6,
      "sort_order": 3
    },
    {
      "id": 4,
      "name": "会员服务",
      "slug": "membership",
      "description": "会员等级、权益、订阅",
      "icon": "crown",
      "faq_count": 4,
      "sort_order": 4
    },
    {
      "id": 5,
      "name": "其他问题",
      "slug": "other",
      "description": "其他常见问题",
      "icon": "help-circle",
      "faq_count": 2,
      "sort_order": 5
    }
  ]
}
```

### 4. 提交FAQ反馈

**端点**: `POST /api/help/faqs/{id}/feedback`
**认证**: 不需要（但建议限流）

**请求参数**:
```json
{
  "helpful": true,  // true表示有用，false表示无用
  "comment": "很清楚，解决了我的问题"  // 可选
}
```

**响应示例**:
```json
{
  "code": 200,
  "msg": "感谢您的反馈",
  "data": {
    "faq_id": 1,
    "helpful": true,
    "new_helpful_count": 26,
    "new_not_helpful_count": 2
  }
}
```

---

## 🔄 工作流程

### 用户查看FAQ流程

```
1. 用户访问帮助中心
   └─> 前端调用 GET /api/help/categories
   └─> 展示分类列表
   
2. 用户选择分类
   └─> 前端调用 GET /api/help/faqs?category={slug}
   └─> 展示该分类下的FAQ列表
   
3. 用户点击FAQ
   └─> 前端调用 GET /api/help/faqs/{id}
   └─> 展示FAQ详情和相关FAQ
   
4. 用户阅读后反馈
   └─> 前端调用 POST /api/help/faqs/{id}/feedback
   └─> 提交有用/无用反馈
```

### 搜索FAQ流程

```
1. 用户输入搜索关键词
   └─> 前端调用 GET /api/help/faqs?search={keyword}
   
2. 展示搜索结果
   └─> 高亮匹配的关键词
   
3. 用户点击查看详情
   └─> 前端调用 GET /api/help/faqs/{id}
```

---

## 📊 数据结构

### FAQ（help_faqs）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | FAQ ID |
| category_id | int | 分类ID |
| title | string | 标题 |
| summary | string | 摘要 |
| content | text | 内容（Markdown） |
| helpful_count | int | 有用计数 |
| not_helpful_count | int | 无用计数 |
| view_count | int | 浏览次数 |
| sort_order | int | 排序 |
| is_published | boolean | 是否发布 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### FAQ分类（help_categories）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 分类ID |
| name | string | 分类名称 |
| slug | string | URL标识 |
| description | string | 描述 |
| icon | string | 图标 |
| sort_order | int | 排序 |
| created_at | datetime | 创建时间 |

---

## 🎯 前端集成示例

### TypeScript类型定义

```typescript
// types/help.ts
export interface HelpCategory {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  faq_count: number
  sort_order: number
}

export interface HelpFAQ {
  id: number
  category_id: number
  category_name: string
  title: string
  summary: string
  content?: string
  helpful_count: number
  not_helpful_count: number
  view_count: number
  related_faqs?: Array<{
    id: number
    title: string
  }>
  created_at: string
  updated_at: string
}
```

### Composable示例

```typescript
// composables/useHelp.ts
import { ref } from 'vue'
import { apiClient } from '@/utils/api'

export function useHelp() {
  const categories = ref<HelpCategory[]>([])
  const faqs = ref<HelpFAQ[]>([])
  const currentFAQ = ref<HelpFAQ | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      loading.value = true
      const response = await apiClient.get('/help/categories')
      categories.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取FAQ列表
  const fetchFAQs = async (params?: {
    category?: string
    search?: string
  }) => {
    try {
      loading.value = true
      const response = await apiClient.get('/help/faqs', { params })
      faqs.value = response.data.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取FAQ详情
  const fetchFAQ = async (id: number) => {
    try {
      loading.value = true
      const response = await apiClient.get(`/help/faqs/${id}`)
      currentFAQ.value = response.data.data
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 提交反馈
  const submitFeedback = async (id: number, helpful: boolean, comment?: string) => {
    try {
      const response = await apiClient.post(`/help/faqs/${id}/feedback`, {
        helpful,
        comment
      })
      return response.data.data
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  return {
    categories,
    faqs,
    currentFAQ,
    loading,
    error,
    fetchCategories,
    fetchFAQs,
    fetchFAQ,
    submitFeedback
  }
}
```

### Vue组件示例

```vue
<template>
  <div class="help-center">
    <!-- 分类列表 -->
    <div class="categories-grid">
      <Card
        v-for="category in categories"
        :key="category.id"
        class="category-card"
        @click="handleCategoryClick(category.slug)"
      >
        <CardContent>
          <div class="icon">{{ category.icon }}</div>
          <h3>{{ category.name }}</h3>
          <p>{{ category.description }}</p>
          <Badge>{{ category.faq_count }} 篇文章</Badge>
        </CardContent>
      </Card>
    </div>

    <!-- FAQ列表 -->
    <div v-if="selectedCategory" class="faqs-list">
      <h2>{{ selectedCategory }}</h2>
      <div v-for="faq in faqs" :key="faq.id" class="faq-item" @click="handleFAQClick(faq.id)">
        <h3>{{ faq.title }}</h3>
        <p>{{ faq.summary }}</p>
        <div class="meta">
          <span>{{ faq.view_count }} 次浏览</span>
          <span>{{ faq.helpful_count }} 人觉得有用</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useHelp } from '@/composables/useHelp'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const { categories, faqs, fetchCategories, fetchFAQs } = useHelp()
const selectedCategory = ref<string | null>(null)

onMounted(async () => {
  await fetchCategories()
})

const handleCategoryClick = async (slug: string) => {
  selectedCategory.value = slug
  await fetchFAQs({ category: slug })
}

const handleFAQClick = (id: number) => {
  router.push(`/help/faq/${id}`)
}
</script>
```

---

## 📝 相关文档

- [用户反馈API](./13-用户反馈API.md) - 用户反馈功能
- [管理后台API](./15-管理后台API.md) - FAQ管理

---

## 📋 版本历史

### v1.0.0 (2026-01-17)
- 初始版本
- 文档化帮助中心所有API端点
- 提供完整的前端集成示例

---

**维护者**: 薛小川  
**最后更新**: 2026-01-17
