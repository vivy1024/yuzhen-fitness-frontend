# AI聊天API文档

**状态**: ✅ 已完成
**版本**: v1.0.0
**更新日期**: 2026-01-17

---

## 📋 概述

AI聊天API提供与DAML-RAG服务的交互接口，支持流式和非流式聊天，通过Laravel后端代理到DAML-RAG服务。

### 核心特性

- ✅ **流式聊天** - Server-Sent Events (SSE) 实时响应
- ✅ **非流式聊天** - 传统JSON响应
- ✅ **健康检查** - 检查AI服务状态
- ✅ **自动代理** - Laravel后端自动转发到DAML-RAG服务
- ✅ **CORS处理** - 自动处理跨域请求
- ✅ **错误处理** - 统一的错误响应格式

---

## 🔧 技术架构

### 代理架构

```
前端PWA (localhost:9000)
    ↓ HTTP/REST API
Laravel后端 (localhost:8000/api/ai)
    ↓ 代理转发
DAML-RAG服务 (localhost:8001/api/v1)
    ↓
Neo4j + Qdrant + MySQL + Redis
```

### 为什么使用代理？

1. **统一认证**: 前端只需要Laravel的JWT Token
2. **CORS处理**: 避免前端直接跨域请求DAML-RAG
3. **错误处理**: 统一的错误响应格式
4. **监控日志**: 在Laravel层记录所有AI请求

---

## 📡 API端点

### 1. 流式聊天

**端点**: `POST /api/ai/v1/chat/stream`

**认证**: 可选（建议使用JWT Token）

**Content-Type**: `application/json`

**请求参数**:
```json
{
  "message": "帮我制定一个8周增肌计划",
  "user_id": "user_123",
  "session_id": "session_456",
  "context": {
    "user_profile": {
      "age": 25,
      "gender": "male",
      "fitness_goal": "gain_muscle",
      "experience_level": "beginner"
    }
  }
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户消息内容 |
| user_id | string | 否 | 用户ID（用于个性化） |
| session_id | string | 否 | 会话ID（用于上下文） |
| context | object | 否 | 上下文信息（用户档案等） |

**响应格式**: Server-Sent Events (SSE)

**响应示例**:
```
data: {"type":"start","timestamp":1704182400000}

data: {"type":"tool","tool_name":"intelligent_exercise_selector","status":"running"}

data: {"type":"tool","tool_name":"intelligent_exercise_selector","status":"success","result":{...}}

data: {"type":"content","content":"根据您的情况，我为您制定了以下训练计划：\n\n"}

data: {"type":"content","content":"**第1周：适应期**\n"}

data: {"type":"content","content":"- 杠铃深蹲 4组 x 8-12次\n"}

data: {"type":"end","timestamp":1704182450000}
```

**SSE事件类型**:
| 类型 | 说明 | 数据结构 |
|------|------|---------|
| start | 开始响应 | `{type:"start",timestamp:number}` |
| tool | MCP工具调用 | `{type:"tool",tool_name:string,status:string,result?:any}` |
| content | 内容片段 | `{type:"content",content:string}` |
| end | 响应结束 | `{type:"end",timestamp:number}` |
| error | 错误信息 | `{type:"error",error:string}` |

---

### 2. 非流式聊天

**端点**: `POST /api/ai/v1/chat`

**认证**: 可选（建议使用JWT Token）

**Content-Type**: `application/json`

**请求参数**: 与流式聊天相同

**响应示例**:
```json
{
  "code": 200,
  "msg": "响应成功",
  "data": {
    "message": "根据您的情况，我为您制定了以下训练计划：\n\n**第1周：适应期**\n- 杠铃深蹲 4组 x 8-12次\n- 杠铃卧推 4组 x 8-12次\n...",
    "session_id": "session_456",
    "tools_used": [
      {
        "name": "intelligent_exercise_selector",
        "status": "success",
        "duration": 150
      }
    ],
    "timestamp": 1704182400000
  }
}
```

---

### 3. 健康检查

**端点**: `GET /api/ai/health`

**认证**: 不需要

**响应示例**:
```json
{
  "code": 200,
  "msg": "AI服务正常",
  "data": {
    "status": "healthy",
    "daml_rag_url": "http://localhost:8001",
    "response_time": 50,
    "timestamp": 1704182400000
  }
}
```

**健康状态**:
| 状态 | 说明 |
|------|------|
| healthy | 服务正常 |
| degraded | 服务降级（响应慢） |
| unhealthy | 服务异常 |

---

## 🔄 工作流程

### 流式聊天流程

```
用户输入消息
    ↓
前端调用 POST /api/ai/v1/chat/stream
    ↓
Laravel后端代理到 DAML-RAG
    ↓
DAML-RAG处理请求（11步工作流程）
    ↓
通过SSE实时返回响应片段
    ↓
前端逐步显示AI回复
```

### DAML-RAG 11步工作流程

```
【阶段1：LLM决策】
步骤1: 预加载用户档案
步骤2: 会话记录存储
步骤3: 检查会员权限
步骤4: BGE复杂度分类
步骤5: 智能模型选择
步骤6: Few-Shot检索
步骤6.5: LLM选择DAG方案

【阶段2：程序执行】
步骤7: DAG编排器执行
步骤8: 三层检索（Vector→Graph→Constraint）
步骤9: 工具结果汇总

【阶段3：LLM综合】
步骤10: LLM深度分析
步骤11: 记录交互
```

---

## 🎯 前端集成示例

### 流式聊天（推荐）

```typescript
import { EventSourcePolyfill } from 'event-source-polyfill'

async function streamChat(message: string) {
  const token = localStorage.getItem('access_token')
  const userId = localStorage.getItem('current_user_id')
  
  const eventSource = new EventSourcePolyfill(
    'http://localhost:8000/api/ai/v1/chat/stream',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        user_id: userId,
        session_id: generateSessionId()
      })
    }
  )
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    switch (data.type) {
      case 'start':
        console.log('开始响应')
        break
        
      case 'tool':
        console.log('工具调用:', data.tool_name, data.status)
        break
        
      case 'content':
        // 逐步显示内容
        appendContent(data.content)
        break
        
      case 'end':
        console.log('响应结束')
        eventSource.close()
        break
        
      case 'error':
        console.error('错误:', data.error)
        eventSource.close()
        break
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('连接错误:', error)
    eventSource.close()
  }
}
```

### 非流式聊天

```typescript
import api from '@/api/ai'

async function chat(message: string) {
  try {
    const response = await api.post('/ai/v1/chat', {
      message,
      user_id: localStorage.getItem('current_user_id'),
      session_id: generateSessionId()
    })
    
    if (response.code === 200) {
      const aiMessage = response.data.message
      console.log('AI回复:', aiMessage)
      
      // 显示完整回复
      displayMessage(aiMessage)
    }
  } catch (error) {
    console.error('聊天失败:', error)
  }
}
```

### 健康检查

```typescript
async function checkAIHealth() {
  try {
    const response = await api.get('/ai/health')
    
    if (response.code === 200) {
      const status = response.data.status
      console.log('AI服务状态:', status)
      
      if (status !== 'healthy') {
        showWarning('AI服务响应较慢，请稍候')
      }
    }
  } catch (error) {
    showError('AI服务不可用')
  }
}
```

---

## 📊 数据结构

### ChatRequest（聊天请求）

```typescript
interface ChatRequest {
  message: string
  user_id?: string
  session_id?: string
  context?: {
    user_profile?: UserProfile
    conversation_history?: Message[]
    [key: string]: any
  }
}
```

### ChatResponse（聊天响应）

```typescript
interface ChatResponse {
  code: number
  msg: string
  data: {
    message: string
    session_id: string
    tools_used: ToolCall[]
    timestamp: number
  }
}
```

### SSEEvent（SSE事件）

```typescript
type SSEEvent = 
  | { type: 'start', timestamp: number }
  | { type: 'tool', tool_name: string, status: string, result?: any }
  | { type: 'content', content: string }
  | { type: 'end', timestamp: number }
  | { type: 'error', error: string }
```

---

## 🔧 错误处理

### 常见错误码

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| 400 | 请求参数错误 | 检查message字段 |
| 401 | 未认证 | 提供JWT Token |
| 429 | 请求过于频繁 | 等待后重试 |
| 500 | DAML-RAG服务错误 | 检查AI服务状态 |
| 503 | 服务不可用 | 稍后重试 |

### 错误响应示例

```json
{
  "code": 500,
  "msg": "AI服务暂时不可用",
  "data": {
    "error": "Connection timeout",
    "daml_rag_status": "unhealthy"
  }
}
```

---

## 🎨 前端UI建议

### 流式聊天UI

1. **打字机效果**: 逐字显示AI回复
2. **工具调用提示**: 显示"正在查询动作库..."
3. **加载动画**: 显示思考中的动画
4. **错误提示**: 友好的错误提示信息

### 示例代码

```vue
<template>
  <div class="chat-container">
    <div class="messages">
      <div v-for="msg in messages" :key="msg.id" class="message">
        <div v-if="msg.role === 'user'" class="user-message">
          {{ msg.content }}
        </div>
        <div v-else class="ai-message">
          <div v-if="msg.isStreaming" class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <div v-html="renderMarkdown(msg.content)"></div>
          <div v-if="msg.tools" class="tools-used">
            <span v-for="tool in msg.tools" :key="tool.name">
              🔧 {{ tool.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="input-area">
      <textarea v-model="inputMessage" @keydown.enter="sendMessage" />
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>
```

---

## 🔗 相关文档

- [话题管理API](./02-话题管理API.md) - 会话管理
- [评分系统API](./05-评分系统API.md) - AI回复评分
- [DAML-RAG完整工作流程](../../../daml-rag-server/docs/02-核心架构/03-完整工作流程.md)

---

## 📝 使用场景

### 场景1：健身咨询

```
用户: "我想增肌，应该怎么训练？"
AI: 调用用户档案工具 → 调用动作选择工具 → 生成个性化建议
```

### 场景2：训练计划生成

```
用户: "帮我制定一个8周增肌计划"
AI: 调用DAG编排器 → 执行训练计划生成DAG → 返回完整计划
```

### 场景3：动作指导

```
用户: "杠铃深蹲的正确姿势是什么？"
AI: 调用动作查询工具 → 返回动作详情和视频链接
```

---

## 📈 版本历史

### v1.0.0 (2026-01-17) - 初始版本

**变更内容**:
- ✅ 创建AI聊天API文档
- ✅ 文档化流式和非流式聊天接口
- ✅ 说明Laravel代理架构
- ✅ 提供前端集成示例
- ✅ 包含SSE事件类型说明

---

**维护者**: 薛小川
**最后更新**: 2026-01-17
