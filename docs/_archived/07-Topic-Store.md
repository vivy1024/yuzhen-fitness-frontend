# Topic Store

> 自动生成 | 对应源文件: stores/topic.ts

## 概述

Topic Store 负责管理对话话题的 CRUD 操作。采用混合模式：登录用户使用后端API持久化，游客使用 IndexedDB 本地存储。

## State

| 状态 | 类型 | 说明 |
|------|------|------|
| `topics` | `ref<Topic[]>` | 话题列表 |
| `currentTopicId` | `ref<string \| null>` | 当前话题ID |
| `loading` | `ref<boolean>` | 加载状态 |
| `error` | `ref<string \| null>` | 错误信息 |
| `initialized` | `ref<boolean>` | 是否已初始化 |

## Getters

| Getter | 说明 |
|--------|------|
| `currentTopic` | 当前话题对象 |
| `sortedTopics` | 按更新时间排序的话题列表 |
| `isLoggedIn` | 用户是否已登录 |

## Actions

### 初始化

```typescript
// 初始化话题列表
async function init()

// 重新初始化（登录/登出后刷新数据）
async function reinit()
```

### 数据获取

```typescript
// 获取话题列表
async function fetchTopics()
```

### 话题管理

```typescript
// 创建新话题
async function createNewTopic(data: { name: string })

// 删除话题
async function removeTopic(topicId: string)

// 设置当前话题
function setCurrentTopic(topicId: string | null)

// 更新话题信息（本地+后端/IndexedDB）
async function updateTopicLocally(topicId: string, updates: Partial<Topic>)

// 确保话题存在（不存在则创建）
async function ensureTopicExists(topicId: string, name?: string): Promise<Topic>
```

### 消息计数

```typescript
// 增加话题消息计数
function incrementMessageCount(topicId: string)
```

### 状态清理

```typescript
// 清空所有话题
function clearTopics()
```

## 使用示例

### 1. 初始化话题

```typescript
const topicStore = useTopicStore()

// 初始化
await topicStore.init()

// 获取当前话题
const current = topicStore.currentTopic
```

### 2. 创建新话题

```typescript
// 创建新话题并自动切换
const result = await topicStore.createNewTopic({ name: '训练计划讨论' })

if (result.success) {
  console.log('新话题ID:', result.data.id)
}
```

### 3. 切换话题

```typescript
// 切换到指定话题
topicStore.setTopic(topicId)

// 或从列表中选择
const topic = topicStore.sortedTopics[0]
topicStore.setCurrentTopic(topic.id)
```

### 4. 删除话题

```typescript
// 删除话题
await topicStore.removeTopic(topicId)
```

### 5. 游客/登录混合模式

```typescript
// 自动根据登录状态选择数据源
if (topicStore.isLoggedIn) {
  // 使用后端API
  await topicStore.fetchTopics()
} else {
  // 使用IndexedDB
  console.log('游客模式，数据保存在本地')
}
```

---

**维护者**: 薛小川
**最后更新**: 2025-01-02