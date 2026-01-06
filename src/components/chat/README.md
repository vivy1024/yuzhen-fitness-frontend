# AI聊天组件

本目录包含AI聊天功能的所有组件，实现了工具调用可视化、消息展示等功能。

## 组件列表

### 1. MessageItem.vue
消息展示组件，支持用户消息、AI消息和系统消息的展示。

**功能特性**：
- 用户/AI/系统三种消息类型
- 工具调用标签和徽章
- 个性化指标展示（个性化程度、档案利用率）
- 流式打字效果
- 时间戳格式化

**使用示例**：
```vue
<MessageItem
  :message="{
    id: 'msg_1',
    topicId: 'topic_1',
    role: 'assistant',
    content: '这是AI回复',
    timestamp: Date.now(),
    toolCalls: [...],
    personalizationScore: 0.85,
    profileUtilizationRate: 0.92
  }"
/>
```

### 2. ToolCallTimeline.vue
工具调用时间线组件，展示DAG模板执行过程中调用的MCP工具。

**功能特性**：
- 时间线布局展示工具调用顺序
- 显示工具状态（pending/running/success/error）
- 显示执行时间和数据来源
- 统计成功/失败工具数量

**使用示例**：
```vue
<ToolCallTimeline
  :tool-calls="[
    {
      id: 'tool-1',
      name: 'intelligent_exercise_selector',
      displayName: '智能动作选择器',
      status: 'success',
      startTime: Date.now() - 2000,
      endTime: Date.now() - 1500,
      duration: 500,
      dataSource: '基于1603个专业动作数据库'
    }
  ]"
/>
```

### 3. ToolCallDialog.vue
工具调用详情对话框，显示完整的工具调用记录。

**功能特性**：
- Dialog弹窗展示
- 展开/折叠查看详细信息
- 显示调用参数、执行结果、错误信息
- 时间戳和执行时长展示

**使用示例**：
```vue
<ToolCallDialog
  v-model:open="showDialog"
  :tool-calls="toolCalls"
/>
```

### 4. TopicSidebar.vue
话题侧边栏组件，管理AI聊天话题。

**功能特性**：
- Sheet侧边栏展示
- 话题列表显示
- 创建、切换、删除话题
- 显示话题消息数量和最后消息

**使用示例**：
```vue
<TopicSidebar
  v-model:visible="showSidebar"
  :topics="topics"
  :current-topic-id="currentTopicId"
  @select-topic="handleTopicChange"
  @create-topic="handleNewTopic"
/>
```

## 数据结构

### Message
```typescript
interface Message {
  id: string
  topicId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  toolCalls?: ToolCall[]
  trainingPlan?: any
  rating?: any
  personalizationScore?: number
  profileUtilizationRate?: number
  streaming?: boolean
}
```

### ToolCall
```typescript
interface ToolCall {
  id: string
  name: string
  displayName?: string
  status: 'pending' | 'running' | 'success' | 'error'
  startTime: number
  endTime?: number
  duration?: number
  parameters?: Record<string, any>
  result?: any
  error?: string
  dataSource?: string
}
```

## Store使用

### Chat Store
```typescript
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

// 发送消息
await chatStore.sendMessage({
  content: '帮我制定训练计划',
  topicId: 'topic_1'
})

// 加载消息历史
await chatStore.loadMessages('topic_1')

// 获取话题消息
const messages = chatStore.getMessagesByTopic('topic_1')
```

### Topic Store
```typescript
import { useTopicStore } from '@/stores/topic'

const topicStore = useTopicStore()

// 获取话题列表
await topicStore.fetchTopics()

// 创建新话题
await topicStore.createNewTopic({ name: '新对话' })

// 切换话题
topicStore.setCurrentTopic('topic_1')
```

## 工具调用可视化说明

### 新系统架构
1. **LLM决策**：LLM分析用户意图，选择合适的DAG模板
2. **程序执行**：DAG模板内置MCP工具，程序自动执行工具链
3. **LLM翻译**：LLM将工具执行结果翻译成自然语言回复

### 工具调用数据来源
工具调用数据从后端API的`metadata.dag_execution`字段解析：
```json
{
  "content": "AI回复内容",
  "metadata": {
    "dag_execution": {
      "tools": [
        {
          "name": "intelligent_exercise_selector",
          "display_name": "智能动作选择器",
          "status": "success",
          "start_time": 1234567890,
          "end_time": 1234567891,
          "duration": 500,
          "parameters": {...},
          "result": {...},
          "data_source": "基于1603个专业动作数据库"
        }
      ]
    }
  }
}
```

### 展示效果
- 用户可以看到AI使用了哪些专业工具
- 每个工具的执行状态和耗时
- 工具的数据来源（如"基于1603个专业动作数据库"）
- 点击"专业工具"按钮查看详细的调用参数和结果

这提升了系统的专业性和透明度，让用户了解AI建议的数据支撑。

## 开发说明

### 依赖组件
- shadcn-vue: Badge, Dialog, Button, Avatar, Sheet
- lucide-vue-next: 图标库
- Pinia: 状态管理

### 样式规范
- 使用TailwindCSS原子类
- 遵循shadcn-vue设计规范
- 支持亮色/暗色主题

### 待实现功能
- [ ] 对接真实的后端API
- [ ] 实现真实的流式响应
- [ ] 实现消息评分功能
- [ ] 实现训练计划卡片展示
- [ ] 实现消息搜索功能
- [ ] 实现消息导出功能

---

**维护者**: 薛小川  
**最后更新**: 2025-01-02
