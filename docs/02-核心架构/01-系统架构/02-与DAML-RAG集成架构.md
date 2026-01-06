# 与DAML-RAG集成架构

**版本**: v1.1.0  
**更新日期**: 2026-01-06  
**状态**: ✅ 已完成（实际验证通过）

---

## 📋 概述

本文档描述玉珍健身前端与DAML-RAG AI服务的集成架构，包括数据流、API交互、流式响应处理等核心内容。

### 实际验证结果（2026-01-06）

| 功能 | 状态 | 说明 |
|------|------|------|
| SSE流式连接 | ✅ 正常 | Web Worker处理，实时渲染 |
| 文本流式输出 | ✅ 正常 | chunk事件逐字显示 |
| 工具调用显示 | ✅ 正常 | step事件显示工作流程 |
| 训练计划卡片 | ✅ 正常 | structured_data事件渲染 |
| 个性化回答 | ✅ 正常 | 考虑用户档案（胸椎反曲等） |
| 评分按钮 | ✅ 正常 | 用户满意度反馈机制 |
| 导入计划按钮 | ✅ 正常 | 可导入到我的计划 |

**已知问题**：
- ⚠️ Laravel后端401认证错误（话题保存失败，不影响AI对话）
- ⚠️ 训练计划卡片周期显示bug（"第第-1周"应为"第1-4周"）

---

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                     玉珍健身前端 (PWA)                           │
│                     localhost:9000                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Chat Store │  │Topic Store  │  │  Streaming Store        │ │
│  │  (消息管理) │  │(话题管理)   │  │  (流式响应状态)         │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│  ┌──────┴────────────────┴──────────────────────┴─────────────┐ │
│  │                    API Layer (Axios)                       │ │
│  └────────────────────────────┬───────────────────────────────┘ │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
          ┌─────────▼─────────┐   ┌─────────▼─────────┐
          │   Laravel后端     │   │   DAML-RAG服务    │
          │   localhost:8000  │   │   localhost:8001  │
          │                   │   │                   │
          │ • 用户认证        │   │ • AI聊天         │
          │ • 话题管理        │   │ • 流式响应       │
          │ • 训练计划存储    │   │ • 工具调用       │
          │ • 用户档案        │   │ • 训练计划生成   │
          └───────────────────┘   └─────────┬─────────┘
                                            │
                              ┌─────────────┼─────────────┐
                              │             │             │
                    ┌─────────▼───┐ ┌───────▼───┐ ┌───────▼───┐
                    │   Neo4j     │ │  Qdrant   │ │   Redis   │
                    │ (图数据库) │ │ (向量库)  │ │  (缓存)   │
                    └─────────────┘ └───────────┘ └───────────┘
```

### 数据流说明

1. **用户发送消息** → Chat Store → API Layer → DAML-RAG
2. **DAML-RAG处理** → 三层检索 → MCP工具调用 → LLM综合
3. **流式响应返回** → SSE → Streaming Store → 实时渲染

---

## 🔄 DAML-RAG工作流程（前端视角）

### 11步工作流程

```
【阶段1：LLM决策】前端等待
  步骤1: 预加载用户档案（0延迟）
  步骤2: 会话记录存储（Few-Shot）
  步骤3: 检查会员权限
  步骤4: BGE复杂度分类
  步骤5: 智能模型选择（教师/学生）
  步骤6: Few-Shot检索（推理时学习）
  步骤6.5: LLM选择DAG方案（从模板库）
  ↓
【阶段2：程序执行】前端显示工具调用
  步骤7: DAG编排器（执行选中的DAG）
  步骤8: 三层检索（Vector→Graph→Constraint）
  步骤9: 工具结果汇总（结构化JSON）
  ↓
【阶段3：LLM综合】前端流式显示
  步骤10: LLM深度分析（专业推理+建议）
  步骤11: 记录交互（用于未来学习）
```

### 前端关注点

| 阶段 | 前端行为 | 用户体验 |
|------|---------|---------|
| 阶段1 | 显示"思考中..." | 等待状态 |
| 阶段2 | 显示工具调用时间线 | 透明化AI决策过程 |
| 阶段3 | 流式渲染文本 | 实时看到回答生成 |

---

## 📡 API交互

### 聊天API

**端点**: `POST /api/chat/stream`

**请求格式**:
```typescript
interface ChatRequest {
  message: string
  topic_id?: string
  user_profile?: UserProfile  // 用户档案（可选，后端会自动获取）
}
```

**响应格式**: Server-Sent Events (SSE)

```typescript
// 工具调用事件
interface ToolCallEvent {
  type: 'tool_call'
  data: {
    tool_name: string
    status: 'started' | 'completed' | 'failed'
    duration_ms?: number
    result_summary?: string
  }
}

// 文本流事件
interface TextStreamEvent {
  type: 'text'
  data: {
    content: string
    is_final: boolean
  }
}

// 训练计划事件
interface TrainingPlanEvent {
  type: 'training_plan'
  data: {
    plan: TrainingPlan
    can_import: boolean
  }
}

// 错误事件
interface ErrorEvent {
  type: 'error'
  data: {
    code: string
    message: string
  }
}
```

### 用户档案API

**端点**: `GET /api/user/profile`

**响应格式**:
```typescript
interface UserProfile {
  basic_info: {
    age: number
    gender: 'male' | 'female'
    height: number  // cm
    weight: number  // kg
  }
  fitness_info: {
    training_level: TrainingLevel
    training_goals: TrainingGoal[]
    available_equipment: Equipment[]
    training_frequency: number  // 每周训练天数
    session_duration: number    // 每次训练时长（分钟）
  }
  health_status: {
    injury_history: InjuryType[]
    postural_issues: PosturalIssue[]  // v1.1.0新增
    medical_conditions: string[]
  }
}
```

---

## 🔗 数据映射关系

### 前端选项与Neo4j节点对应

前端用户档案选项与Neo4j节点完全对应，无需复杂映射：

| 前端字段 | Neo4j节点 | 数量 | 映射方式 |
|---------|----------|------|---------|
| `available_equipment` | Equipment | 21个 | 1:1中英文对照 |
| `injury_history` | InjuryType | 21个 | 1:1中英文对照 |
| `training_goals` | TrainingGoal | 8个 | 1:1中英文对照 |
| `training_level` | TrainingLevel | 4个 | 1:1中英文对照 |
| `postural_issues` | PosturalIssue | 12个 | 1:1中英文对照 |

### 数据统一化优势

- ✅ **无映射层**: 前端选项直接对应Neo4j节点
- ✅ **减少错误**: 消除映射转换可能的错误
- ✅ **简化维护**: 修改只需同步前端和Neo4j
- ✅ **性能提升**: 无需运行时映射转换

详细映射关系参见：[用户档案数据映射](./03-用户档案数据映射.md)

---

## 🌊 流式响应处理

### 前端实现架构

```typescript
// composables/useChatStream.ts
export function useChatStream() {
  const streamingStore = useStreamingStore()
  
  async function sendMessage(message: string, topicId?: string) {
    // 1. 创建EventSource连接
    const eventSource = new EventSource(
      `/api/chat/stream?message=${encodeURIComponent(message)}&topic_id=${topicId}`
    )
    
    // 2. 处理工具调用事件
    eventSource.addEventListener('tool_call', (event) => {
      const data = JSON.parse(event.data)
      streamingStore.addToolCall(data)
    })
    
    // 3. 处理文本流事件
    eventSource.addEventListener('text', (event) => {
      const data = JSON.parse(event.data)
      streamingStore.appendText(data.content)
    })
    
    // 4. 处理训练计划事件
    eventSource.addEventListener('training_plan', (event) => {
      const data = JSON.parse(event.data)
      streamingStore.setTrainingPlan(data.plan)
    })
    
    // 5. 处理完成/错误
    eventSource.addEventListener('done', () => {
      eventSource.close()
      streamingStore.setComplete()
    })
    
    eventSource.addEventListener('error', (event) => {
      eventSource.close()
      streamingStore.setError(event)
    })
  }
  
  return { sendMessage }
}
```

### 工具调用可视化

```vue
<!-- components/chat/ToolCallTimeline.vue -->
<template>
  <div class="tool-call-timeline">
    <div 
      v-for="tool in toolCalls" 
      :key="tool.id"
      class="tool-call-item"
    >
      <div class="tool-icon">
        <component :is="getToolIcon(tool.tool_name)" />
      </div>
      <div class="tool-info">
        <span class="tool-name">{{ getToolDisplayName(tool.tool_name) }}</span>
        <span class="tool-status" :class="tool.status">
          {{ getStatusText(tool.status) }}
        </span>
        <span v-if="tool.duration_ms" class="tool-duration">
          {{ tool.duration_ms }}ms
        </span>
      </div>
    </div>
  </div>
</template>
```

---

## 🛠️ MCP工具展示

### 工具分类与图标

| 工具类型 | 工具名称 | 显示名称 | 图标 |
|---------|---------|---------|------|
| P0核心 | intelligent_exercise_selector | 智能动作选择 | 🎯 |
| P0核心 | contraindications_checker | 禁忌症检查 | ⚠️ |
| P0核心 | injury_risk_assessor | 损伤风险评估 | 🏥 |
| P0核心 | muscle_group_volume_calculator | 训练量计算 | 📊 |
| P0核心 | tdee_calculator | TDEE计算 | 🔥 |
| P1建议 | professional_program_designer | 训练计划设计 | 📋 |
| P1建议 | postural_assessor | 体态评估 | 🧘 |
| P1建议 | meal_plan_designer | 膳食计划设计 | 🍽️ |

### 工具调用状态

```typescript
type ToolCallStatus = 'started' | 'completed' | 'failed'

const statusConfig = {
  started: { text: '执行中...', color: 'blue', icon: 'spinner' },
  completed: { text: '完成', color: 'green', icon: 'check' },
  failed: { text: '失败', color: 'red', icon: 'x' }
}
```

---

## 📱 训练计划展示

### 训练计划数据结构

```typescript
interface TrainingPlan {
  id: string
  name: string
  description: string
  duration_weeks: number
  training_days: TrainingDay[]
  created_at: string
}

interface TrainingDay {
  day_of_week: number  // 1-7
  focus: string        // 训练重点
  exercises: Exercise[]
  warmup?: Exercise[]   // v8.59.0新增
  cooldown?: Exercise[] // v8.59.0新增
}

interface Exercise {
  id: number
  name_zh: string
  sets: number
  reps: string         // "8-12" 或 "12"
  rest_seconds: number
  notes?: string
}
```

### 训练计划卡片组件

```vue
<!-- components/training/TrainingPlanCard.vue -->
<template>
  <Card class="training-plan-card">
    <CardHeader>
      <CardTitle>{{ plan.name }}</CardTitle>
      <CardDescription>{{ plan.description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="plan-meta">
        <Badge>{{ plan.duration_weeks }}周计划</Badge>
        <Badge variant="outline">{{ plan.training_days.length }}天/周</Badge>
      </div>
      <div class="training-days">
        <TrainingDayItem 
          v-for="day in plan.training_days"
          :key="day.day_of_week"
          :day="day"
        />
      </div>
    </CardContent>
    <CardFooter>
      <Button @click="importPlan" :disabled="importing">
        {{ importing ? '导入中...' : '导入到我的计划' }}
      </Button>
    </CardFooter>
  </Card>
</template>
```

---

## 🔒 错误处理

### 错误码定义

| 错误码 | 说明 | 前端处理 |
|-------|------|---------|
| `AUTH_REQUIRED` | 需要登录 | 跳转登录页 |
| `RATE_LIMITED` | 请求频率限制 | 显示倒计时 |
| `SERVICE_UNAVAILABLE` | AI服务不可用 | 显示重试按钮 |
| `INVALID_REQUEST` | 请求参数错误 | 显示错误提示 |
| `TOOL_EXECUTION_FAILED` | 工具执行失败 | 显示降级结果 |

### 错误处理示例

```typescript
// stores/chat.ts
function handleStreamError(error: StreamError) {
  switch (error.code) {
    case 'AUTH_REQUIRED':
      router.push('/auth/login')
      break
    case 'RATE_LIMITED':
      toast.warning(`请求过于频繁，请${error.retry_after}秒后重试`)
      break
    case 'SERVICE_UNAVAILABLE':
      toast.error('AI服务暂时不可用，请稍后重试')
      break
    default:
      toast.error(error.message || '发生未知错误')
  }
}
```

---

## 📊 性能优化

### 流式响应优化

1. **Web Worker处理**: SSE解析在Worker中进行，不阻塞主线程
2. **批量更新**: 文本流每100ms批量更新一次，减少渲染次数
3. **虚拟滚动**: 长对话使用虚拟滚动，只渲染可见消息

### 缓存策略

1. **IndexedDB缓存**: 聊天历史本地缓存，支持离线查看
2. **用户档案缓存**: 用户档案缓存24小时，减少API调用
3. **训练计划缓存**: 已导入的训练计划本地持久化

---

## 🔗 相关文档

- [系统架构总览](./01-系统架构总览.md)
- [用户档案数据映射](./03-用户档案数据映射.md)
- [Chat Store实现](../../03-代码参考/02-Store实现/01-Chat-Store.md)
- [DAML-RAG完整工作流程](../../../../daml-rag-server/docs/02-核心架构/03-完整工作流程.md)

---

**维护者**: 薛小川  
**最后更新**: 2026-01-06
