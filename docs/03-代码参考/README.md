# 03-代码参考

本目录包含前端项目的核心代码实现参考，详细说明各个模块的实现细节。

---

## 📚 文档列表

### [01-核心组件](./01-核心组件/)
- **聊天组件**: MessageItem、ToolCallTimeline、ToolCallDialog
- **训练组件**: TrainingPlanCard
- **通用组件**: TopicSidebar

### [02-Store实现](./02-Store实现/)
- **Chat Store**: 消息管理、流式响应
- **Topic Store**: 话题管理
- **Streaming Store**: 流式状态管理
- **Auth Store**: 用户认证

### [03-Composables](./03-Composables/)
- **useChatStream**: 流式响应核心逻辑
- **useAuth**: 认证逻辑
- **useToast**: Toast提示

### [04-工具函数](./04-工具函数/)
- **streaming-cache**: IndexedDB缓存
- **format**: 格式化函数
- **validation**: 验证函数

---

## 🎯 代码组织原则

### 1. 单一职责

每个模块只负责一个功能：

```typescript
// ✅ 好的实践
// chat.ts - 只负责聊天相关
export const useChatStore = defineStore('chat', () => {
  // 聊天相关状态和方法
})

// topic.ts - 只负责话题相关
export const useTopicStore = defineStore('topic', () => {
  // 话题相关状态和方法
})
```

### 2. 可复用性

提取可复用逻辑到Composables：

```typescript
// composables/useChatStream.ts
export function useChatStream() {
  const isStreaming = ref(false)
  const streamedContent = ref('')
  
  async function startStream(params: StreamParams) {
    // 流式响应逻辑
  }
  
  return { isStreaming, streamedContent, startStream }
}
```

### 3. 类型安全

为所有数据定义TypeScript接口：

```typescript
// types/chat.ts
export interface Message {
  id: string
  topicId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
  trainingPlan?: TrainingPlan
}
```

### 4. 错误处理

统一的错误处理模式：

```typescript
async function sendMessage(data: SendMessageData) {
  try {
    loading.value = true
    // 业务逻辑
    return { success: true }
  } catch (err: any) {
    error.value = err.message || '操作失败'
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}
```

---

## 📊 代码统计

### 组件统计

| 类型 | 数量 | 说明 |
|------|------|------|
| 页面组件 | 10+ | views目录 |
| 业务组件 | 15+ | components目录 |
| UI组件 | 30+ | shadcn-vue |

### Store统计

| Store | 状态数 | 方法数 | 说明 |
|-------|--------|--------|------|
| chat | 4 | 8 | 消息管理 |
| topic | 4 | 8 | 话题管理 |
| streaming | 6 | 5 | 流式状态 |
| auth | 3 | 5 | 用户认证 |

### API统计

| 模块 | 接口数 | 说明 |
|------|--------|------|
| auth | 4 | 认证相关 |
| topic | 6 | 话题管理 |
| training-plan | 5 | 训练计划 |

---

## 🔧 开发规范

### 命名规范

**组件命名**: PascalCase
```typescript
// MessageItem.vue
// TrainingPlanCard.vue
// TopicSidebar.vue
```

**函数命名**: camelCase
```typescript
// sendMessage
// loadMessages
// importTrainingPlan
```

**常量命名**: UPPER_SNAKE_CASE
```typescript
// API_BASE_URL
// MAX_MESSAGE_LENGTH
// DEFAULT_TIMEOUT
```

### 文件组织

```
src/
├── components/
│   ├── chat/           # 聊天相关组件
│   ├── training/       # 训练相关组件
│   └── ui/            # UI基础组件
├── stores/            # Pinia Store
├── composables/       # 可复用逻辑
├── api/              # API封装
├── utils/            # 工具函数
└── types/            # 类型定义
```

---

## 🔗 相关文档

- [核心组件实现](./01-核心组件/README.md)
- [Store实现](./02-Store实现/README.md)
- [Composables实现](./03-Composables/README.md)

---

**维护者**: 薛小川  
**最后更新**: 2025-01-02
