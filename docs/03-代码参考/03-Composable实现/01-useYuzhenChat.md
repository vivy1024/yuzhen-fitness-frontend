# useYuzhenChat

> 对应源文件: composables/useYuzhenChat.ts
> 版本: v3.0.0 | 更新: 2026-05-16

## 概述

WebSocket 实时对话 Composable，连接 YuzhenFork Studio 的 `/api/sessions/:id/chat` 端点。管理 WebSocket 连接生命周期、消息收发、流式内容、工具调用状态。

替代旧版 `useChatStream.ts`（SSE 方式）。

## 使用

```ts
import { useYuzhenChat } from '@/composables/useYuzhenChat'

const {
  messages,        // 消息列表
  session,         // 当前 session 信息
  connectionState, // 连接状态
  isConnected,     // 是否已连接
  isWorking,       // Agent 是否在工作
  isStreaming,     // 是否在流式输出
  streamingContent,// 当前流式内容
  error,           // 错误信息
  connect,         // 连接到 session
  disconnect,      // 断开连接
  sendMessage,     // 发送消息
  abort,           // 中止生成
} = useYuzhenChat()
```

## 返回值

### 状态（Refs）

| 属性 | 类型 | 说明 |
|------|------|------|
| `messages` | `Ref<ChatMessage[]>` | 消息列表（含工具调用） |
| `session` | `Ref<SessionInfo \| null>` | 当前 session 信息 |
| `connectionState` | `Ref<ConnectionState>` | 连接状态 |
| `isConnected` | `ComputedRef<boolean>` | 是否已连接 |
| `isWorking` | `Ref<boolean>` | Agent 是否在工作 |
| `isStreaming` | `ComputedRef<boolean>` | 是否在流式输出 |
| `streamingContent` | `Ref<string>` | 当前流式内容 |
| `error` | `Ref<string \| null>` | 错误信息 |

### 方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `connect(sessionId, resumeFromSeq?)` | session ID | 连接到指定 session |
| `disconnect()` | — | 断开 WebSocket |
| `sendMessage(content)` | 消息文本 | 发送用户消息 |
| `abort()` | — | 中止当前生成 |
| `ack(seq)` | 序号 | 确认收到消息 |

## 类型定义

```ts
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: number
  seq?: number
  toolCalls?: ToolCallInfo[]
  thinking?: ThinkingBlock[]
  runtime?: { providerId?: string; modelId?: string; usage?: TokenUsage }
}

interface ToolCallInfo {
  id: string
  toolName: string
  status?: 'pending' | 'running' | 'success' | 'error'
  summary?: string
  input?: unknown
  result?: unknown
  output?: string
  error?: string
  duration?: number
  confirmationRequired?: boolean
  confirmation?: { id: string; reason: string; suggestion?: string }
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
```

## WebSocket 协议

连接地址：`ws://localhost:4600/api/sessions/:id/chat?resumeFromSeq=N`

### 接收事件

- `session:snapshot` — 初始化（历史消息 + session 状态）
- `session:state` — 状态变化（working/idle）
- `session:stream` — 流式文本 delta
- `session:message` — 完整消息
- `session:error` — 错误

### 发送事件

- `{type: "session:message", content, ack}` — 发送消息
- `{type: "session:abort"}` — 中止
- `{type: "session:ack", ack}` — 确认序号

## 断线重连

WebSocket 非正常关闭时，自动在 3 秒后重连，传入 `resumeFromSeq` 恢复未收到的消息。
