# 知识库API

**状态**: 已完成
**版本**: v1.0.0
**更新日期**: 2026-02-28
**对应源文件**: `src/api/knowledge.ts`
**后端模块**: `app/Modules/Knowledge/Controllers/KnowledgeController.php`

---

## 概述

知识库API提供健身知识文章、分类和搜索功能。用户可以浏览、搜索和阅读健身相关的知识文章。

**核心功能**：
- 获取知识文章列表（支持分页和筛选）
- 获取文章详情（含相关内容推荐）
- 获取知识分类列表
- 搜索知识文章
- 获取知识卡片（推荐阅读）

---

## 端点列表

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | /api/knowledge | 获取知识文章列表 | 否 |
| GET | /api/knowledge/{id} | 获取文章详情 | 否 |
| GET | /api/knowledge/categories | 获取知识分类 | 否 |
| GET | /api/knowledge/search | 搜索知识文章 | 否 |
| GET | /api/knowledge/cards | 获取知识卡片 | 是 |

---

## 详细说明

### 1. 获取知识文章列表

获取知识库文章列表，支持分页、分类和标签筛选。

```http
GET /api/knowledge
```

**认证**: 否

**请求参数**（Query）：
```typescript
{
  page?: number;         // 页码，默认1
  per_page?: number;    // 每页数量，默认20
  category_id?: number; // 分类ID
  tag?: string;         // 标签筛选
}
```

**请求示例**：
```
GET /api/knowledge?page=1&per_page=10&category_id=1
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "如何科学增肌",
        "summary": "本文介绍科学增肌的方法和原理...",
        "category": {
          "id": 1,
          "name": "增肌指南",
          "slug": "muscle-gain",
          "article_count": 15
        },
        "source_type": "article",
        "source_name": "健身百科",
        "source_book": "专业健身指南",
        "tags": ["增肌", "训练", "营养"],
        "difficulty": "intermediate",
        "view_count": 1234,
        "created_at": "2026-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 10,
      "total": 200,
      "per_page": 20
    }
  }
}
```

---

### 2. 获取文章详情

获取单篇知识文章的完整内容，包含相关推荐。

```http
GET /api/knowledge/{id}
```

**认证**: 否

**路径参数**：
- `id`: 文章ID

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": 1,
    "title": "如何科学增肌",
    "summary": "本文介绍科学增肌的方法和原理...",
    "content": "增肌的核心原理是通过渐进超负荷...",
    "category": {
      "id": 1,
      "name": "增肌指南",
      "slug": "muscle-gain",
      "article_count": 15
    },
    "source_type": "article",
    "source_name": "健身百科",
    "source_book": "专业健身指南",
    "tags": ["增肌", "训练", "营养"],
    "difficulty": "intermediate",
    "view_count": 1234,
    "created_at": "2026-01-15T10:00:00Z",
    "references": [
      { "title": "运动生理学", "url": "https://example.com", "source": "参考文献1" },
      { "title": "营养学指南", "source: "参考文献2" }
    ],
    "related": [
      {
        "id": 2,
        "title": "增肌期的饮食安排",
        "summary": "合理的饮食对增肌至关重要...",
        "category": { "id": 1, "name": "增肌指南", "slug": "muscle-gain", "article_count": 15 },
        "source_type": "article",
        "source_name": "健身百科",
        "tags": ["增肌", "饮食"],
        "created_at": "2026-01-10T10:00:00Z"
      }
    ]
  }
}
```

---

### 3. 获取知识分类

获取所有知识文章分类。

```http
GET /api/knowledge/categories
```

**认证**: 否

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    { "id": 1, "name": "增肌指南", "slug": "muscle-gain", "article_count": 15 },
    { "id": 2, "name": "减脂攻略", "slug": "fat-loss", "article_count": 12 },
    { "id": 3, "name": "营养知识", "slug": "nutrition", "article_count": 20 },
    { "id": 4, "name": "训练技巧", "slug": "training-tips", "article_count": 18 },
    { "id": 5, "name": "康复训练", "slug": "rehabilitation", "article_count": 8 }
  ]
}
```

---

### 4. 搜索知识文章

根据关键词搜索知识文章。

```http
GET /api/knowledge/search
```

**认证**: 否

**请求参数**（Query）：
```typescript
{
  q: string;             // 搜索关键词（必填）
  page?: number;        // 页码，默认1
  per_page?: number;    // 每页数量，默认20
}
```

**请求示例**：
```
GET /api/knowledge/search?q=增肌&per_page=10
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "如何科学增肌",
        "summary": "本文介绍科学增肌的方法和原理...",
        "category": { "id": 1, "name": "增肌指南", "slug": "muscle-gain", "article_count": 15 },
        "source_type": "article",
        "source_name": "健身百科",
        "tags": ["增肌", "训练", "营养"],
        "created_at": "2026-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "last_page": 5,
      "total": 95,
      "per_page": 20
    }
  }
}
```

---

### 5. 获取知识卡片

获取推荐阅读的知识卡片（需要登录）。

```http
GET /api/knowledge/cards
```

**认证**: 是

**请求参数**（Query）：
```typescript
{
  count?: number;        // 返回数量，默认5
  category_id?: number; // 分类ID筛选
}
```

**请求示例**：
```
GET /api/knowledge/cards?count=5&category_id=1
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": 1,
      "title": "如何科学增肌",
      "summary": "本文介绍科学增肌的方法和原理...",
      "category": { "id": 1, "name": "增肌指南", "slug": "muscle-gain", "article_count": 15 },
      "source_type": "article",
      "source_name": "健身百科",
      "tags": ["增肌", "训练", "营养"],
      "difficulty": "intermediate",
      "view_count": 1234,
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## 数据结构

### KnowledgeArticle（知识文章）

```typescript
interface KnowledgeArticle {
  id: number;
  title: string;                    // 标题
  summary: string;                  // 摘要
  category: KnowledgeCategory;     // 分类信息
  source_type: string;            // 来源类型
  source_name: string;            // 来源名称
  source_book?: string;           // 来源书籍
  tags: string[];                  // 标签
  difficulty?: string;            // 难度
  view_count?: number;            // 浏览次数
  created_at: string;             // 创建时间
}
```

### KnowledgeCategory（知识分类）

```typescript
interface KnowledgeCategory {
  id: number;
  name: string;                    // 分类名称
  slug: string;                    // 分类别名
  article_count: number;          // 文章数量
}
```

### KnowledgeDetail（知识详情）

```typescript
interface KnowledgeDetail extends KnowledgeArticle {
  content: string;                // 文章内容
  references: Array<{             // 参考文献
    title: string;
    url?: string;
    source: string;
  }>;
  related: KnowledgeArticle[];   // 相关推荐
}
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 401 | 未授权（知识卡片需要登录） |
| 404 | 文章不存在 |
| 500 | 服务器内部错误 |

---

## 前端集成示例

```typescript
// composables/useKnowledge.ts
import { ref } from 'vue'
import {
  getKnowledgeList,
  getKnowledgeDetail,
  getKnowledgeCategories,
  searchKnowledge,
  getKnowledgeCards
} from '@/api/knowledge'

export function useKnowledge() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取文章列表
  const fetchArticleList = async (params?: {
    page?: number
    per_page?: number
    category_id?: number
    tag?: string
  }) => {
    loading.value = true
    try {
      const response = await getKnowledgeList(params)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '获取文章列表失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取文章详情
  const fetchArticleDetail = async (id: number) => {
    loading.value = true
    try {
      const response = await getKnowledgeDetail(id)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '获取文章详情失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 搜索文章
  const search = async (keyword: string, page = 1, perPage = 20) => {
    loading.value = true
    try {
      const response = await searchKnowledge({ q: keyword, page, per_page: perPage })
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.msg || '搜索失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchArticleList,
    fetchArticleDetail,
    search
  }
}
```

---

## 相关文档

- [动作库API](./09-动作库API.md) - 健身动作数据
- [食物库API](./08-食物库API.md) - 食物营养数据
- [帮助中心API](./14-帮助中心API.md) - 用户帮助文档

---

## 版本历史

### v1.0.0 (2026-02-28)
- 初始版本
- 文档化5个知识库API端点
- 说明文章列表、详情、分类、搜索、卡片功能
- 说明知识文章的数据结构