# Streaming Store

> 自动生成 | 对应源文件: stores/streaming.ts

## 概述

Streaming Store 负责全局流式响应状态管理，支持导航指示器显示和跨页面状态同步。用于在用户离开聊天页面时显示流式进度。

## State

| 状态 | 类型 | 说明 |
|------|------|------|
| `status` | `ref<StreamingStatus>` | 流式状态：idle/streaming/completed/error |
| `sessionId` | `ref<string \| null>` | 当前会话ID |
| `userId` | `ref<string \| null>` | 用户ID |
| `query` | `ref<string \| null>` | 当前查询内容 |
| `contentLength` | `ref<number>` | 已接收内容长度 |
| `startTime` | `ref<number \| null>` | 开始时间戳 |
| `hasNewContent` | `ref<boolean>` | 是否有新内容 |
| `errorMessage` | `ref<string \| null>` | 错误信息 |
| `isOnChatPage` | `ref<boolean>` | 是否在聊天页面 |

## Getters

| Getter | 说明 |
|--------|------|
| `isStreaming` | 是否正在流式传输 |
| `hasActiveSession` | 是否有活跃会话 |
| `shouldShowIndicator` | 是否应显示导航指示器 |
| `duration` | 流式持续时间（秒） |
| `state` | 当前状态快照 |

## Actions

### 会话管理

```typescript
// 开始流式会话
function startStreaming(params: { sessionId: string; userId: string; query: string })

// 更新内容长度
function updateContentLength(length: number)

// 标记流式完成
function markCompleted()

// 标记流式错误
function markError(error: string)
```

### 状态管理

```typescript
// 标记新内容已查看
function markContentViewed()

// 设置是否在聊天页面
function setOnChatPage(value: boolean)

// 重置状态
function reset()
```

### 缓存恢复

```typescript
// 从IndexedDB恢复状态
async function restoreFromCache(userIdParam: string): Promise<boolean>
```

## 使用示例

### 1. 开始流式响应

```typescript
const streamingStore = useStreamingStore()

// 用户发送消息时开始流式
streamingStore.startStreaming({
  sessionId: 'uuid-xxx',
  userId: 'user-123',
  query: '给我制定一个训练计划'
})
```

### 2. 更新流式进度

```typescript
// 随着内容到来更新长度
streamingStore.updateContentLength(500)

// 流式完成
streamingStore.markCompleted()

// 或出错
streamingStore.markError('网络错误')
```

### 3. 导航指示器控制

```typescript
// 进入聊天页面时
streamingStore.setOnChatPage(true)

// 离开聊天页面时
streamingStore.setOnChatPage(false)

// 在其他页面检查是否需要显示指示器
if (streamingStore.shouldShowIndicator) {
  // 显示"AI正在回复"指示器
}
```

### 4. 页面刷新后恢复状态

```typescript
const userId = localStorage.getItem('user_id')

// 恢复之前的流式状态
const restored = await streamingStore.restoreFromCache(userId)

if (restored) {
  console.log('状态已恢复，会话:', streamingStore.sessionId)
}
```

### 5. 获取状态快照

```typescript
// 获取完整状态用于调试
const currentState = streamingStore.state

console.log('状态:', currentState.status)
console.log('持续时间:', streamingStore.duration, '秒')
```

---

**维护者**: 薛小川
**最后更新**: 2025-01-02