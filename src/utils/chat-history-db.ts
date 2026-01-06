/**
 * Chat History Database - 对话历史持久化存储
 * 
 * 使用IndexedDB实现对话历史的持久化存储，支持：
 * - 对话消息存储和检索
 * - 话题（Topic）管理
 * - 跨会话恢复
 * 
 * @author 玉珍健身 v3.0
 * @created 2025-01-02
 * @migrated from V2
 */

import Dexie, { type Table } from 'dexie'

// ============ 类型定义 ============

export type MessageRole = 'user' | 'assistant' | 'system'

export interface MessageMetadata {
  interaction_id?: string
  model_used?: string
  tools_used?: string[]
  execution_time?: number
  personalization_score?: number
  // 训练计划数据（用于渲染TrainingPlanCard）
  trainingPlan?: any
  // 工具调用数据（用于渲染ToolCallTimeline）
  toolCalls?: any[]
}

export interface ChatMessage {
  id: string
  topicId: string
  userId: string
  role: MessageRole
  content: string
  timestamp: string
  streaming?: boolean
  rating?: number
  metadata?: MessageMetadata
  createdAt: number
  updatedAt: number
}

export interface ChatTopic {
  id: string
  userId: string
  name: string
  messageCount: number
  createdAt: string
  updatedAt: string
  pinned?: boolean
  lastMessagePreview?: string
}

// ============ 配置常量 ============

const CONFIG = {
  DB_NAME: 'YuzhenChatHistoryDB',
  DB_VERSION: 1,
  DEFAULT_PAGE_SIZE: 50
}

// ============ 数据库定义 ============

class ChatHistoryDatabase extends Dexie {
  messages!: Table<ChatMessage, string>
  topics!: Table<ChatTopic, string>

  constructor() {
    super(CONFIG.DB_NAME)
    
    this.version(CONFIG.DB_VERSION).stores({
      messages: 'id, topicId, userId, createdAt, [topicId+createdAt]',
      topics: 'id, userId, updatedAt, [userId+updatedAt]'
    })
  }
}

let dbInstance: ChatHistoryDatabase | null = null

function getDB(): ChatHistoryDatabase {
  if (!dbInstance) {
    dbInstance = new ChatHistoryDatabase()
  }
  return dbInstance
}

// ============ 话题管理 ============

export async function createTopic(
  userId: string,
  name?: string
): Promise<ChatTopic> {
  const db = getDB()
  const now = new Date().toISOString()
  
  const existingTopics = await db.topics
    .where('userId')
    .equals(userId)
    .count()
  
  const topic: ChatTopic = {
    id: `topic_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    userId,
    name: name || `新话题 ${existingTopics + 1}`,
    messageCount: 0,
    createdAt: now,
    updatedAt: now,
    pinned: false
  }
  
  await db.topics.put(topic)
  console.log(`[ChatHistoryDB] 创建话题: ${topic.id}`)
  
  return topic
}

export async function getUserTopics(userId: string): Promise<ChatTopic[]> {
  const db = getDB()
  
  try {
    let topics = await db.topics
      .where('userId')
      .equals(userId)
      .toArray()
    
    // 按更新时间倒序排序
    topics.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    
    return topics
  } catch (error: any) {
    console.error('[ChatHistoryDB] 获取话题失败:', error)
    return []
  }
}

export async function getTopic(topicId: string): Promise<ChatTopic | null> {
  const db = getDB()
  
  try {
    const topic = await db.topics.get(topicId)
    return topic || null
  } catch (error: any) {
    console.error('[ChatHistoryDB] 获取话题失败:', error)
    return null
  }
}

export async function updateTopic(
  topicId: string,
  updates: Partial<Omit<ChatTopic, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  const db = getDB()
  
  try {
    await db.topics.update(topicId, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('[ChatHistoryDB] 更新话题失败:', error)
    throw error
  }
}

export async function deleteTopic(topicId: string): Promise<void> {
  const db = getDB()
  
  try {
    await db.transaction('rw', [db.topics, db.messages], async () => {
      await db.messages.where('topicId').equals(topicId).delete()
      await db.topics.delete(topicId)
    })
    console.log(`[ChatHistoryDB] 删除话题: ${topicId}`)
  } catch (error: any) {
    console.error('[ChatHistoryDB] 删除话题失败:', error)
    throw error
  }
}

// ============ 消息管理 ============

export async function saveMessage(
  message: Omit<ChatMessage, 'createdAt' | 'updatedAt'>
): Promise<ChatMessage> {
  const db = getDB()
  const now = Date.now()
  
  const fullMessage: ChatMessage = {
    ...message,
    createdAt: now,
    updatedAt: now
  }
  
  try {
    await db.transaction('rw', [db.messages, db.topics], async () => {
      await db.messages.put(fullMessage)
      
      const topic = await db.topics.get(message.topicId)
      if (topic) {
        await db.topics.update(message.topicId, {
          messageCount: topic.messageCount + 1,
          lastMessagePreview: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
          updatedAt: new Date().toISOString()
        })
      }
    })
    
    return fullMessage
  } catch (error: any) {
    console.error('[ChatHistoryDB] 保存消息失败:', error)
    throw error
  }
}

export async function getTopicMessages(topicId: string): Promise<ChatMessage[]> {
  const db = getDB()
  
  try {
    let messages = await db.messages
      .where('topicId')
      .equals(topicId)
      .toArray()
    
    messages.sort((a, b) => a.createdAt - b.createdAt)
    
    return messages
  } catch (error: any) {
    console.error('[ChatHistoryDB] 获取消息失败:', error)
    return []
  }
}

export async function updateMessage(
  messageId: string,
  updates: Partial<Omit<ChatMessage, 'id' | 'topicId' | 'userId' | 'createdAt'>>
): Promise<void> {
  const db = getDB()
  
  try {
    await db.messages.update(messageId, {
      ...updates,
      updatedAt: Date.now()
    })
  } catch (error: any) {
    console.error('[ChatHistoryDB] 更新消息失败:', error)
    throw error
  }
}

export async function clearTopicMessages(topicId: string): Promise<void> {
  const db = getDB()
  
  try {
    await db.transaction('rw', [db.messages, db.topics], async () => {
      await db.messages.where('topicId').equals(topicId).delete()
      
      await db.topics.update(topicId, {
        messageCount: 0,
        lastMessagePreview: undefined,
        updatedAt: new Date().toISOString()
      })
    })
  } catch (error: any) {
    console.error('[ChatHistoryDB] 清空消息失败:', error)
    throw error
  }
}

export { CONFIG as CHAT_HISTORY_CONFIG }
