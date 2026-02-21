# 03-代码参考

本目录包含前端项目的核心代码实现参考，详细说明各个模块的实现细节。

---

## 📚 文档列表

### 01-核心组件 *(待创建)*
- **聊天组件**: MessageItem、ToolCallTimeline、ToolCallDialog
- **训练组件**: TrainingPlanCard
- **通用组件**: TopicSidebar

### [02-Store实现](./02-Store实现/)
- **Chat Store**: 消息管理、流式响应
- **Topic Store**: 话题管理
- **Streaming Store**: 流式状态管理
- **Auth Store**: 用户认证

### 03-Composables *(待创建)*
- **useChatStream**: 流式响应核心逻辑
- **useAccessibility**: 无障碍功能
- **useLazyImage**: 图片懒加载
- **useNetworkStatus**: 网络状态检测
- **usePWAInstall**: PWA安装引导
- **useTheme**: 主题切换

### 04-工具函数 *(待创建)*
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
| 页面组件 | 40 | views目录 |
| 业务组件 | 146 | components目录（14个分类） |
| 组件分类 | chat, training, exercise, food, ui, layout, user, user-profile, membership, progress, charts, accessibility, pwa, theme | |

### Store统计（15个）

| Store | 说明 |
|-------|------|
| chat | 消息管理 |
| topic | 话题管理 |
| streaming | 流式状态 |
| auth | 用户认证 |
| user | 用户信息 |
| training | 训练管理 |
| exercise | 运动数据 |
| food | 食物库 |
| credit | 积分管理 |
| membership | 会员管理 |
| usage | 用量管理 |
| notification | 通知管理 |
| progress | 进度追踪 |
| feedback | 用户反馈 |
| theme | 主题设置 |

### Composables统计（6个）

| Composable | 说明 |
|------------|------|
| useChatStream | 流式响应核心逻辑 |
| useAccessibility | 无障碍功能 |
| useLazyImage | 图片懒加载 |
| useNetworkStatus | 网络状态检测 |
| usePWAInstall | PWA安装引导 |
| useTheme | 主题切换 |

### API统计（19个模块）

| 模块 | 说明 |
|------|------|
| auth | 认证相关 |
| user | 用户信息 |
| exercise | 运动数据 |
| training-session | 训练会话 |
| training-plan | 训练计划 |
| topic | 话题管理 |
| food | 食物库 |
| credit | 积分管理 |
| membership | 会员管理 |
| usage | 用量管理 |
| rating | 评分系统 |
| progress | 进度追踪 |
| feedback | 用户反馈 |
| help | 帮助中心 |
| notification | 通知 |
| warmup | 预热 |
| email | 邮件 |
| sms | 短信 |
| settings | 设置 |
| admin/ | 管理员后台（子目录） |

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
├── components/        # 业务组件（146个，14个分类）
│   ├── chat/           # 聊天相关组件
│   ├── training/       # 训练相关组件
│   ├── exercise/       # 运动相关组件
│   ├── food/           # 食物相关组件
│   ├── user/           # 用户相关组件
│   ├── user-profile/   # 用户档案组件
│   ├── membership/     # 会员相关组件
│   ├── progress/       # 进度追踪组件
│   ├── charts/         # 图表组件
│   ├── layout/         # 布局组件
│   ├── ui/             # UI基础组件
│   ├── accessibility/  # 无障碍组件
│   ├── pwa/            # PWA相关组件
│   └── theme/          # 主题组件
├── stores/            # Pinia Store（15个）
├── composables/       # 可复用逻辑（6个）
├── api/              # API封装（19个模块）
├── utils/            # 工具函数
└── types/            # 类型定义
```

---

## 🔗 相关文档

- 01-核心组件实现 *(待创建)*
- [Store实现](./02-Store实现/README.md)
- 03-Composables实现 *(待创建)*

---

**维护者**: 薛小川  
**最后更新**: 2026-02-21
