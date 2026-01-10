/**
 * 话题管理API
 * 提供话题的增删查改接口
 * 
 * @version 2.0.0
 * @date 2026-01-11
 * @requirements 1.1-1.6 对话历史与上下文管理
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

// ============ 话题管理 ============

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

// ============ 话题消息 ============

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

// ============ 对话历史 (Requirements 1.2) ============

/**
 * 对话历史记录
 */
export interface ChatHistoryItem {
  id: number
  sessionId: string
  topicId: string | null
  userQuery: string
  llmResponse: string
  modelUsed: string
  toolsUsed: string[] | null
  userRating: number | null
  userFeedback: string | null
  metadata: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

/**
 * 获取用户对话历史
 * GET /api/chat/history
 * 
 * @requirements 1.2 检索用户最近的对话历史
 */
export interface GetHistoryParams {
  topic_id?: string
  session_id?: string
  limit?: number
  offset?: number
}

export interface HistoryResponse {
  total: number
  limit: number
  offset: number
  history: ChatHistoryItem[]
}

export const getChatHistory = (params?: GetHistoryParams): Promise<ApiResponse<HistoryResponse>> => {
  return api.get('/chat/history', { params })
}

// ============ 会话管理 (Requirements 1.5) ============

/**
 * 会话信息
 */
export interface ChatSessionInfo {
  sessionId: string
  title: string
  topicId: string | null
  messageCount: number
  lastQuery: string
  lastResponse: string
  modelUsed: string
  createdAt: string
  updatedAt: string
}

/**
 * 获取用户会话列表
 * GET /api/chat/sessions
 * 
 * @requirements 1.5 创建新会话ID并初始化
 */
export interface GetSessionsParams {
  limit?: number
  offset?: number
}

export interface SessionsResponse {
  total: number
  limit: number
  offset: number
  sessions: ChatSessionInfo[]
}

export const getChatSessions = (params?: GetSessionsParams): Promise<ApiResponse<SessionsResponse>> => {
  return api.get('/chat/sessions', { params })
}

/**
 * 会话详情消息
 */
export interface SessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  modelUsed?: string
  toolsUsed?: string[] | null
  metadata?: Record<string, any> | null
}

/**
 * 获取单个会话详情
 * GET /api/chat/sessions/:sessionId
 */
export interface SessionDetailResponse {
  sessionId: string
  topicId: string | null
  messageCount: number
  messages: SessionMessage[]
  createdAt: string
  updatedAt: string
}

export const getSessionDetail = (sessionId: string): Promise<ApiResponse<SessionDetailResponse>> => {
  return api.get(`/chat/sessions/${sessionId}`)
}

/**
 * 删除会话
 * DELETE /api/chat/sessions/:sessionId
 */
export interface DeleteSessionResponse {
  sessionId: string
  deletedCount: number
}

export const deleteSession = (sessionId: string): Promise<ApiResponse<DeleteSessionResponse>> => {
  return api.delete(`/chat/sessions/${sessionId}`)
}
