# Exercise Store

> 自动生成 | 对应源文件: stores/exercise.ts

## 概述

Exercise Store 负责管理动作库的数据获取、筛选、搜索和收藏功能。提供完整的分页加载、筛选条件管理、关键词搜索、收藏夹管理。支持筛选选项24小时缓存，优化加载性能。

## State

| 状态 | 类型 | 说明 |
|------|------|------|
| `exercises` | `ref<ExerciseBasic[]>` | 动作列表 |
| `currentExercise` | `ref<ExerciseDetail \| null>` | 当前查看的动作详情 |
| `filterOptions` | `ref<FilterOptions \| null>` | 筛选选项（带缓存） |
| `currentFilters` | `ref<FilterConditions>` | 当前筛选条件 |
| `searchKeyword` | `ref<string>` | 搜索关键词 |
| `selectedMuscle` | `ref<string \| undefined>` | 选中的肌肉部位 |
| `pagination` | `ref<PaginationInfo>` | 分页信息 |
| `loading` | `ref<boolean>` | 加载状态 |
| `error` | `ref<string \| null>` | 错误信息 |
| `favorites` | `ref<Set<number>>` | 收藏的动作ID集合 |

### PaginationInfo 类型

```typescript
interface PaginationInfo {
  current: number      // 当前页码
  pageSize: number     // 每页数量
  total: number        // 总数
  totalPages: number   // 总页数
}
```

## Getters

| 计算属性 | 说明 |
|----------|------|
| `totalCount` | 动作总数量 |
| `hasMore` | 是否还有更多数据（可加载下一页） |

## Actions

### 数据获取

**fetchList(params?)** - 获取动作列表
- 参数支持：reset（重置到第一页）、page（指定页码）、muscle（肌肉筛选）、search（关键词搜索）
- 使用当前筛选条件和分页信息

**fetchDetail(id)** - 获取动作详情

**fetchFilterOptions()** - 获取筛选选项
- 带24小时缓存
- API失败时降级使用过期缓存

### 搜索

**search(keyword)** - 搜索动作
- 更新搜索关键词并重置到第一页

### 筛选

**updateFilters(filters)** - 更新筛选条件
- 设置筛选条件并重新加载列表

### 收藏

**toggleFavorite(id)** - 切换收藏状态
**isFavorite(id)** - 检查是否已收藏

### 缓存管理

**clearFilterCache()** - 清除筛选选项缓存

### 状态重置

**reset()** - 重置所有状态
- 清空动作列表、筛选条件、搜索词、分页信息

## 使用示例

### 1. 获取动作列表

```typescript
import { useExerciseStore } from '@/stores/exercise'

const exerciseStore = useExerciseStore()

// 首次加载（第一页）
await exerciseStore.fetchList()

// 加载更多（下一页）
if (exerciseStore.hasMore) {
  await exerciseStore.fetchList({ page: exerciseStore.pagination.current + 1 })
}
```

### 2. 筛选和搜索

```typescript
// 按肌肉部位筛选
await exerciseStore.fetchList({ muscle: '胸肌', reset: true })

// 关键词搜索
await exerciseStore.search('卧推')

// 多条件筛选
await exerciseStore.updateFilters({
  difficulty: 'beginner',
  equipment: '哑铃'
})

// 清除所有筛选条件
exerciseStore.reset()
```

### 3. 收藏功能

```typescript
// 切换收藏
exerciseStore.toggleFavorite(exerciseId)

// 检查收藏状态
if (exerciseStore.isFavorite(exerciseId)) {
  console.log('已收藏')
}

// 遍历所有收藏的动作ID
exerciseStore.favorites.forEach(id => {
  console.log('收藏ID:', id)
})
```

### 4. 获取详情

```typescript
// 获取动作详情
await exerciseStore.fetchDetail(exerciseId)

// 当前查看的动作
const current = exerciseStore.currentExercise
console.log(current?.name, current?.name_zh)
```