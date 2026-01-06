/**
 * 话题管理API
 * 提供话题的增删查改接口
 */

import api from './auth'

export interface Topic {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage?: string
}

export interface CreateTopicData {
  name: string
}

export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/**
 * 获取话题列表
 * GET /api/chat/topics
 */
export const getTopics = (): Promise<ApiResponse<Topic[]>> => {
  return api.get('/chat/topics')
}

/**
 * 创建新话题
 * POST /api/chat/topics
 */
export const createTopic = (data: CreateTopicData): Promise<ApiResponse<Topic>> => {
  return api.post('/chat/topics', data)
}

/**
 * 删除话题
 * DELETE /api/chat/topics/:id
 */
export const deleteTopic = (topicId: string): Promise<ApiResponse<null>> => {
  return api.delete(`/chat/topics/${topicId}`)
}

/**
 * 获取话题详情（可选，用于获取完整的话题信息）
 * GET /api/chat/topics/:id
 */
export const getTopicDetail = (topicId: string): Promise<ApiResponse<Topic>> => {
  return api.get(`/chat/topics/${topicId}`)
}

/**
 * 更新话题信息（可选，用于重命名话题等）
 * PUT /api/chat/topics/:id
 */
export const updateTopic = (topicId: string, data: Partial<CreateTopicData>): Promise<ApiResponse<Topic>> => {
  return api.put(`/chat/topics/${topicId}`, data)
}

/**
 * 获取话题消息列表
 * GET /api/chat/topics/:id/messages
 */
export interface TopicMessage {
  id: string
  topicId: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  toolCalls?: any[]
  trainingPlan?: any
}

export const getTopicMessages = (topicId: string): Promise<ApiResponse<TopicMessage[]>> => {
  return api.get(`/chat/topics/${topicId}/messages`)
}

/**
 * 保存单条消息
 * POST /api/chat/topics/:id/messages
 */
export interface SaveMessageData {
  role: 'user' | 'assistant' | 'system'
  content: string
  client_id?: string
  metadata?: Record<string, any>
}

export const saveTopicMessage = (topicId: string, data: SaveMessageData): Promise<ApiResponse<TopicMessage>> => {
  return api.post(`/chat/topics/${topicId}/messages`, data)
}

/**
 * 批量同步消息
 * POST /api/chat/topics/:id/messages/sync
 */
export interface SyncMessageData {
  role: 'user' | 'assistant' | 'system'
  content: string
  client_id: string
  timestamp?: number
  metadata?: Record<string, any>
}

export interface SyncResult {
  synced: Array<{ client_id: string; server_id: string }>
  skipped: string[]
  synced_count: number
  skipped_count: number
}

export const syncTopicMessages = (topicId: string, messages: SyncMessageData[]): Promise<ApiResponse<SyncResult>> => {
  return api.post(`/chat/topics/${topicId}/messages/sync`, { messages })
}
