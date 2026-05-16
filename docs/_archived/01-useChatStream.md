# useChatStream

> 自动生成 | 对应源文件: composables/useChatStream.ts

## 概述

SSE 流式聊天 Composable，提供基于 Web Worker 的后台流式处理能力。通过 Web Worker 在后台处理 SSE 连接，不受页面生命周期影响；使用 IndexedDB 持久化流式内容，支持页面刷新后恢复；实现暂停/恢复功能；提供自动重连机制（最多 3 次）和状态订阅机制。

## 参数

无参数（`useChatStream()` 不接受参数）

## 返回值

### 状态（Refs）

| 属性 | 类型 | 说明 |
|------|------|------|
| `isStreaming` | `Ref<boolean>` | 是否正在流式传输 |
| `streamedContent` | `Ref<string>` | 已接收的流式内容 |
| `structuredData` | `Ref<any[]>` | 结构化数据数组 |
| `error` | `Ref<string \| null>` | 错误信息 |
| `currentStep` | `Ref<number>` | 当前步骤编号 |
| `currentStepMessage` | `Ref<string>` | 当前步骤消息 |
| `totalLength` | `Ref<number>` | 内容总长度 |
| `duration` | `Ref<number>` | 耗时（毫秒） |
| `requestId` | `Ref<string>` | 请求 ID |
| `workerStatus` | `Ref<WorkerStatus>` | Worker 状态 |
| `currentSessionId` | `Ref<string \| null>` | 当前会话 ID |
| `isStreamingSupported` | `Ref<boolean>` | 是否支持流式 |
| `compatibilityWarning` | `Ref<string \| null>` | 兼容性警告 |

### 计算属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `renderedContent` | `ComputedRef<string>` | Markdown 渲染后的内容 |
| `streamState` | `ComputedRef<StreamState>` | 完整状态对象 |
| `hasError` | `ComputedRef<boolean>` | 是否有错误 |
| `isDone` | `ComputedRef<boolean>` | 是否已完成 |

### 核心方法

| 方法 | 签名 | 说明 |
|------|------|------|
| `startStream` | `(params: SendMessageParams) => Promise<void>` | 启动流式传输 |
| `stopStream` | `() => void` | 停止流式传输 |
| `resumeSession` | `(sessionId: string) => Promise<boolean>` | 恢复指定会话 |
| `tryResumeActiveSession` | `(userId: string) => Promise<boolean>` | 尝试恢复最新活跃会话 |
| `getState` | `() => StreamState` | 获取当前状态 |
| `subscribe` | `(callback: StateSubscriber) => () => void` | 订阅状态变化 |
| `resetState` | `() => void` | 重置状态 |
| `cleanup` | `() => void` | 清理资源 |
| `cleanupExpiredSessions` | `(maxAgeMs?: number) => Promise<number>` | 清理过期会话 |

### SendMessageParams 接口

```typescript
interface SendMessageParams {
  userId: string           // 用户ID
  query: string            // 用户查询
  sessionId?: string       // 会话ID（可选）
  topicId?: string        // 话题ID，用于多轮对话
  domain?: string         // 领域，默认 'fitness'
  strategy?: 'dag' | 'agent'  // 执行策略
  templateId?: string     // DAG模板ID
  attachments?: Array<{   // 附件
    type: string
    filename: string
    mime_type: string
    data: string
    size: number
  }>
  personaId?: string       // 角色ID
}
```

### WorkerStatus 类型

```typescript
type WorkerStatus = 'idle' | 'connected' | 'disconnected' | 'reconnecting' | 'error'
```

### 导出函数（兼容性检测）

| 函数 | 说明 |
|------|------|
| `isSSESupported` | 检测浏览器是否支持 SSE |
| `isFetchSupported` | 检测浏览器是否支持 Fetch |
| `isReadableStreamSupported` | 检测浏览器是否支持 ReadableStream |
| `isStreamingSupported` | 检测是否支持流式传输 |

## 使用示例

### 示例 1：基础流式聊天

```vue
<script setup lang="ts">
import { useChatStream } from '@/composables/useChatStream'

const {
  isStreaming,
  streamedContent,
  error,
  startStream,
  stopStream
} = useChatStream()

const sendMessage = async (query: string) => {
  await startStream({
    userId: '123',
    query,
    domain: 'fitness'
  })
}
</script>

<template>
  <div>
    <p v-if="isStreaming">正在生成回答...</p>
    <div v-html="streamedContent"></div>
    <p v-if="error" class="error">{{ error }}</p>
    <button @click="stopStream">停止</button>
  </div>
</template>
```

### 示例 2：状态订阅

```vue
<script setup lang="ts">
import { useChatStream } from '@/composables/useChatStream'

const { subscribe, getState, isStreaming } = useChatStream()

// 订阅状态变化
const unsubscribe = subscribe((state) => {
  console.log('流式状态变化:', {
    isStreaming: state.isStreaming,
    contentLength: state.streamedContent.length,
    step: state.currentStep
  })
})

// 获取当前状态
const currentState = getState()
</script>
```

### 示例 3：会话恢复

```vue
<script setup lang="ts">
import { useChatStream } from '@/composables/useChatStream'

const { tryResumeActiveSession, resumeSession } = useChatStream()

// 页面加载时尝试恢复会话
onMounted(async () => {
  const userId = '123'
  const resumed = await tryResumeActiveSession(userId)
  if (resumed) {
    console.log('会话恢复成功')
  }
})

// 恢复指定会话
const restoreSession = async (sessionId: string) => {
  await resumeSession(sessionId)
}
</template>
```

### 示例 4：降级处理

```vue
<script setup lang="ts">
import { useChatStream } from '@/composables/useChatStream'

const {
  isStreamingSupported,
  compatibilityWarning,
  startStream
} = useChatStream()

// 显示兼容性警告
if (compatibilityWarning.value) {
  console.warn(compatibilityWarning.value)
}

// 自动降级到非流式模式
</template>
```