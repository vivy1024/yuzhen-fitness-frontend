# 话题管理API

**版本**: v1.0.0  
**更新日期**: 2025-01-02  
**状态**: ✅ 已完成

---

## 📋 API列表

### 1. 获取话题列表

**接口**: `GET /api/chat/topics`

**认证**: 需要

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": "1",
      "name": "增肌训练咨询",
      "createdAt": "2025-01-02T10:00:00.000Z",
      "updatedAt": "2025-01-02T12:30:00.000Z",
      "messageCount": 15,
      "lastMessage": "好的，我会按照这个计划训练",
      "lastMessageAt": "2025-01-02T12:30:00.000Z"
    }
  ]
}
```

**前端调用**:
```typescript
import { getTopics } from '@/api/topic'

const response = await getTopics()
const topics = response.data
```

---

### 2. 创建话题

**接口**: `POST /api/chat/topics`

**认证**: 需要

**请求参数**:
```json
{
  "name": "新对话"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 话题名称，最长100字符 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "创建成功",
  "data": {
    "id": "2",
    "name": "新对话",
    "createdAt": "2025-01-02T13:00:00.000Z",
    "updatedAt": "2025-01-02T13:00:00.000Z",
    "messageCount": 0
  }
}
```

**前端调用**:
```typescript
import { createTopic } from '@/api/topic'

const response = await createTopic({
  name: '新对话'
})
const newTopic = response.data
```

---

### 3. 获取话题详情

**接口**: `GET /api/chat/topics/:id`

**认证**: 需要

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 话题ID |

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "id": "1",
    "name": "增肌训练咨询",
    "description": null,
    "createdAt": "2025-01-02T10:00:00.000Z",
    "updatedAt": "2025-01-02T12:30:00.000Z",
    "messageCount": 15,
    "lastMessage": "好的，我会按照这个计划训练",
    "lastMessageAt": "2025-01-02T12:30:00.000Z"
  }
}
```

**前端调用**:
```typescript
import { getTopicDetail } from '@/api/topic'

const response = await getTopicDetail('1')
const topic = response.data
```

---

### 4. 更新话题

**接口**: `PUT /api/chat/topics/:id`

**认证**: 需要

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 话题ID |

**请求参数**:
```json
{
  "name": "增肌训练计划讨论",
  "description": "关于增肌训练的详细讨论"
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 话题名称 |
| description | string | 否 | 话题描述 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "id": "1",
    "name": "增肌训练计划讨论",
    "description": "关于增肌训练的详细讨论",
    "updatedAt": "2025-01-02T13:30:00.000Z"
  }
}
```

**前端调用**:
```typescript
import { updateTopic } from '@/api/topic'

const response = await updateTopic('1', {
  name: '增肌训练计划讨论'
})
```

---

### 5. 删除话题

**接口**: `DELETE /api/chat/topics/:id`

**认证**: 需要

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 话题ID |

**响应示例**:
```json
{
  "code": 200,
  "msg": "删除成功",
  "data": null
}
```

**前端调用**:
```typescript
import { deleteTopic } from '@/api/topic'

const response = await deleteTopic('1')
```

---

### 6. 获取话题消息列表

**接口**: `GET /api/chat/topics/:id/messages`

**认证**: 需要

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 话题ID |

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": "1",
      "topicId": "1",
      "role": "assistant",
      "content": "您好！我是您的智能健身顾问...",
      "timestamp": 1704182400000,
      "toolCalls": [
        {
          "id": "tool-0",
          "name": "intelligent_exercise_selector",
          "displayName": "智能动作选择",
          "status": "success",
          "startTime": 1704182400000,
          "duration": 150,
          "parameters": {...},
          "result": {...}
        }
      ],
      "trainingPlan": {
        "name": "8周增肌计划",
        "weeks": 8,
        "frequency": 4,
        "exercises": [...]
      }
    }
  ]
}
```

**前端调用**:
```typescript
import { getTopicMessages } from '@/api/topic'

const response = await getTopicMessages('1')
const messages = response.data
```

---

## 🔧 错误处理

### 常见错误

**404 - 话题不存在**:
```json
{
  "code": 404,
  "msg": "话题不存在",
  "data": null
}
```

**422 - 参数验证失败**:
```json
{
  "code": 422,
  "msg": "参数验证失败",
  "data": {
    "name": ["话题名称不能为空"]
  }
}
```

**500 - 服务器错误**:
```json
{
  "code": 500,
  "msg": "服务器内部错误",
  "data": null
}
```

---

## 📝 使用示例

### 完整的话题管理流程

```typescript
import { 
  getTopics, 
  createTopic, 
  getTopicMessages,
  deleteTopic 
} from '@/api/topic'

// 1. 获取话题列表
const topicsResponse = await getTopics()
const topics = topicsResponse.data

// 2. 创建新话题
const createResponse = await createTopic({
  name: '新对话'
})
const newTopic = createResponse.data

// 3. 获取话题消息
const messagesResponse = await getTopicMessages(newTopic.id)
const messages = messagesResponse.data

// 4. 删除话题
await deleteTopic(newTopic.id)
```

---

## 🔗 相关文档

- [Chat Store实现](../../03-代码参考/02-Store实现/01-Chat-Store.md)
- [Topic Store实现](../../03-代码参考/02-Store实现/02-Topic-Store.md)
- [API层设计](../../02-核心架构/05-API层/01-API模块设计.md)

---

**维护者**: 薛小川  
**最后更新**: 2025-01-02
