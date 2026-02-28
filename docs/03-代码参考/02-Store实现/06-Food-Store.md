# Food Store

> 自动生成 | 对应源文件: stores/food.ts

## 概述

Food Store 负责管理食物库的搜索、分类、详情查询和收藏功能。支持分页加载、本地缓存和离线收藏。

## State

| 状态 | 类型 | 说明 |
|------|------|------|
| `foods` | `ref<FoodBasic[]>` | 食物列表 |
| `currentFood` | `ref<FoodDetail | null>` | 当前查看的食物详情 |
| `categories` | `ref<FoodCategory[]>` | 食物分类列表 |
| `selectedCategory` | `ref<string \| undefined>` | 当前选中的分类 |
| `searchKeyword` | `ref<string>` | 搜索关键词 |
| `pagination` | `ref<{current, pageSize, total, totalPages}>` | 分页信息 |
| `loading` | `ref<boolean>` | 加载状态 |
| `error` | `ref<string \| null>` | 错误信息 |
| `favorites` | `ref<Set<number>>` | 收藏的食物ID集合 |

## Getters

| Getter | 说明 |
|--------|------|
| `totalCount` | 食物总数 |
| `hasMore` | 是否还有更多数据可加载 |

## Actions

### 数据获取

```typescript
// 获取食物列表（支持分页、搜索、分类筛选）
async function fetchList(params?: { reset?: boolean; page?: number; category?: string; search?: string })

// 获取食物详情
async function fetchDetail(id: number)

// 获取分类列表（带24小时缓存）
async function fetchCategories()
```

### 搜索与筛选

```typescript
// 搜索食物
async function search(keyword: string)

// 按分类筛选
async function filterByCategory(category: string | undefined)
```

### 收藏管理

```typescript
// 切换收藏状态
function toggleFavorite(id: number)

// 检查是否已收藏
function isFavorite(id: number): boolean
```

### 缓存管理

```typescript
// 清除分类缓存
function clearCategoryCache()
```

### 状态重置

```typescript
// 重置状态
function reset()
```

## 使用示例

### 1. 搜索食物

```typescript
const foodStore = useFoodStore()

// 搜索食物
await foodStore.search('鸡胸肉')

// 获取搜索结果
console.log(foodStore.foods)
```

### 2. 按分类浏览

```typescript
// 先获取分类
await foodStore.fetchCategories()

// 选择分类
await foodStore.filterByCategory('肉类')

// 加载更多
if (foodStore.hasMore) {
  await foodStore.fetchList({ page: 2 })
}
```

### 3. 收藏食物

```typescript
// 切换收藏
foodStore.toggleFavorite(food.id)

// 检查收藏状态
const isLiked = foodStore.isFavorite(food.id)
```

---

**维护者**: 薛小川
**最后更新**: 2025-01-02