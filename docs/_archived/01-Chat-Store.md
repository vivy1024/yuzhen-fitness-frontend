# Chat Store实现

**版本**: v1.7.0  
**更新日期**: 2025-01-02  
**状态**: ✅ 已完成

---

## 📋 概述

Chat Store负责管理AI聊天的消息列表、流式响应状态和训练计划导入功能。

**文件位置**: `src/stores/chat.ts`

---

## 🔧 核心功能

### 1. 状态管理

```typescript
// State
const messages = ref<Message[]>([])        // 消息列表
const loading = ref(false)                 // 加载状态
const streaming = ref(false)               // 流式响应状态
const error = ref<string | null>(null)     // 错误信息
```

### 2. 消息管理

#### 加载消息历史

```typescript
/**
 * 加载指定话题的消息历史
 * 从后端API获取消息列表
 */
async function loadMessages(topicId: string) {
  try {
    loading.value = true
    error.value = null
    
    // 调用API获取消息历史
    const response = await getTopicMessages(topicId)
    
    if (response.code === 200 && response.data) {
      // 转换API数据格式为前端Message格式
      messages.value = response.data.map((msg: any) => ({
        id: msg.id,
        topicId: msg.topicId,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        toolCalls: msg.toolCalls,
        trainingPlan: msg.trainingPlan,
        streaming: false
      }))
    } else {
      messages.value = []
    }
    
    return { success: true }
  } catch (err: any) {
    console.error('加载消息失败:', err)
    error.value = err.message || '加载消息失败'
    messages.value = []
    return { success: false, message: error.value }
  } finally {
    loading.value = false
  }
}
```

#### 发送消息

```typescript
/**
 * 发送消息（使用真实流式响应）
 */
async function sendMessage(data: SendMessageData) {
  try {
    loading.value = true
    streaming.value = true
    error.value = null
    
    // 1. 创建用户消息
    const userMessage: Message = {
      id: generateMessageId(),
      topicId: data.topicId || 'default',
      role: 'user',
      content: data.content,
      timestamp: Date.now()
    }
    messages.value.push(userMessage)
    
    // 2. 创建AI消息占位符
    const aiMessage: Message = {
      id: generateMessageId(),
      topicId: data.topicId || 'default',
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true
    }
    messages.value.push(aiMessage)
    currentStreamingMessageId = aiMessage.id
    
    // 3. 订阅流式状态更新
    const unsubscribe = chatStream.subscribe((state) => {
      if (currentStreamingMessageId) {
        updateStreamingMessage(currentStreamingMessageId, {
          content: state.streamedContent
        })
      }
    })
    
    // 4. 启动流式响应
    const userId = localStorage.getItem('user_id') || 'guest'
    await chatStream.startStream({
      userId,
      query: data.content,
      sessionId: chatStream.currentSessionId.value || undefined,
      domain: 'fitness'
    })
    
    // 5. 等待流式完成
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (!chatStream.isStreaming.value) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
    
    // 6. 取消订阅
    unsubscribe()
    
    // 7. 完成流式消息
    finishStreamingMessage(aiMessage.id, {
      content: chatStream.streamedContent.value,
      toolCalls: extractToolCallsFromStructuredData(chatStream.structuredData.value),
      trainingPlan: extractTrainingPlanFromStructuredData(chatStream.structuredData.value)
    })
    
    currentStreamingMessageId = null
    return { success: true, messageId: aiMessage.id }
    
  } catch (err: any) {
    error.value = err.message || '发送消息失败'
    
    // 移除失败的AI消息
    const lastMsg = messages.value[messages.value.length - 1]
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.streaming) {
      messages.value.pop()
    }
    
    currentStreamingMessageId = null
    return { success: false, message: error.value }
    
  } finally {
    loading.value = false
    streaming.value = false
  }
}
```

### 3. 流式响应处理

#### 更新流式消息

```typescript
/**
 * 更新流式消息内容
 */
function updateStreamingMessage(messageId: string, chunk: Partial<AIResponse>) {
  const message = messages.value.find(m => m.id === messageId)
  if (!message) return
  
  // 追加内容
  if (chunk.content) {
    message.content += chunk.content
  }
  
  // 更新工具调用
  if (chunk.toolCalls) {
    message.toolCalls = chunk.toolCalls
  }
  
  // 更新训练计划
  if (chunk.trainingPlan) {
    message.trainingPlan = chunk.trainingPlan
  }
  
  // 更新个性化指标
  if (chunk.personalizationScore !== undefined) {
    message.personalizationScore = chunk.personalizationScore
  }
  
  if (chunk.profileUtilizationRate !== undefined) {
    message.profileUtilizationRate = chunk.profileUtilizationRate
  }
}
```

#### 完成流式消息

```typescript
/**
 * 完成流式消息
 */
function finishStreamingMessage(messageId: string, finalData?: Partial<AIResponse>) {
  const message = messages.value.find(m => m.id === messageId)
  if (!message) return
  
  message.streaming = false
  
  if (finalData) {
    if (finalData.toolCalls) {
      message.toolCalls = finalData.toolCalls
    }
    if (finalData.trainingPlan) {
      message.trainingPlan = finalData.trainingPlan
    }
    if (finalData.personalizationScore !== undefined) {
      message.personalizationScore = finalData.personalizationScore
    }
    if (finalData.profileUtilizationRate !== undefined) {
      message.profileUtilizationRate = finalData.profileUtilizationRate
    }
  }
}
```

### 4. 数据提取

#### 提取工具调用

```typescript
/**
 * 从structuredData中提取工具调用信息
 */
function extractToolCallsFromStructuredData(structuredData: any[]): ToolCall[] | undefined {
  const toolCalls: ToolCall[] = []
  
  for (const item of structuredData) {
    if (item.type === 'dag_execution' && item.data) {
      const dagExecution = item.data
      
      // 解析DAG执行记录中的MCP工具调用
      if (dagExecution.tools && Array.isArray(dagExecution.tools)) {
        dagExecution.tools.forEach((tool: any, index: number) => {
          toolCalls.push({
            id: `tool-${index}`,
            name: tool.name || tool.tool_name || 'unknown',
            displayName: tool.display_name || tool.name,
            status: tool.status || 'success',
            startTime: tool.start_time || Date.now(),
            endTime: tool.end_time,
            duration: tool.duration,
            parameters: tool.parameters,
            result: tool.result,
            error: tool.error,
            dataSource: tool.data_source || tool.metadata?.data_source
          })
        })
      }
    }
  }
  
  return toolCalls.length > 0 ? toolCalls : undefined
}
```

#### 提取训练计划

```typescript
/**
 * 从structuredData中提取训练计划
 */
function extractTrainingPlanFromStructuredData(structuredData: any[]): TrainingPlan | undefined {
  for (const item of structuredData) {
    if (item.type === 'training_plan' && item.data) {
      return item.data as TrainingPlan
    }
  }
  return undefined
}
```

### 5. 训练计划导入

```typescript
/**
 * 导入训练计划
 */
async function importTrainingPlan(plan: TrainingPlan): Promise<{ success: boolean; message?: string }> {
  try {
    // 调用API导入训练计划
    const response = await importPlanAPI({
      name: plan.name,
      description: plan.description,
      weeks: plan.weeks,
      frequency: plan.frequency,
      exercises: plan.exercises,
      target_muscles: plan.targetMuscles,
      safety_notes: plan.safetyNotes,
      difficulty: plan.difficulty,
    })
    
    if (response.code === 200) {
      toast({
        title: '导入成功',
        description: `训练计划"${plan.name}"已添加到您的计划列表`,
        duration: 3000
      })
      return { success: true }
    } else {
      throw new Error(response.msg || '导入失败')
    }
  } catch (err: any) {
    const errorMsg = err.message || '导入训练计划失败'
    toast({
      title: '导入失败',
      description: errorMsg,
      variant: 'destructive'
    })
    return { success: false, message: errorMsg }
  }
}
```

---

## 📊 数据流

```
用户发送消息
    ↓
sendMessage()
    ↓
创建用户消息 + AI占位符
    ↓
useChatStream.startStream()
    ↓
订阅流式更新
    ↓
updateStreamingMessage() (实时更新)
    ↓
等待流式完成
    ↓
finishStreamingMessage()
    ↓
提取工具调用和训练计划
    ↓
视图更新
```

---

## 🔗 相关文档

- [useChatStream实现](../03-Composable实现/01-useChatStream.md)
- [Topic Store实现](./07-Topic-Store.md)
- [Streaming Store实现](./08-Streaming-Store.md)
- [话题管理API](../../05-API文档/02-话题管理API.md)

---

**维护者**: 薛小川  
**最后更新**: 2025-01-02
