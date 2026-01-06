/**
 * Streaming Cache - 流式响应缓存工具
 * 
 * 使用IndexedDB持久化存储流式响应数据，支持：
 * - 流式会话创建和管理
 * - 实时内容追加
 * - 会话状态持久化
 * - 过期会话清理
 * 
 * @author BUILD_BODY v2.0
 * @created 2025-12-30
 * @migrated 2025-01-02 - 迁移到新项目
 */

import Dexie, { type Table } from 'dexie'

// ============ 类型定义 ============

/**
 * 流式会话状态
 */
export type StreamSessionStatus = 'streaming' | 'completed' | 'error' | 'timeout'

/**
 * 结构化数据项
 */
export interface StructuredDataItem {
  type: string
  data: any
  receivedAt: number
}

/**
 * 流式会话接口
 */
export interface StreamSession {
  /** 会话ID（主键） */
  sessionId: string
  /** 用户ID */
  userId: string
  /** 用户查询内容 */
  query: string
  /** 累积的流式内容 */
  content: string
  /** 结构化数据列表 */
  structuredData: StructuredDataItem[]
  /** 会话状态 */
  status: StreamSessionStatus
  /** 当前步骤 */
  currentStep: number
  /** 当前步骤消息 */
  currentStepMessage: string
  /** 错误信息（如果有） */
  errorMessage?: string
  /** 创建时间戳 */
  createdAt: number
  /** 最后更新时间戳 */
  updatedAt: number
  /** 完成时间戳 */
  completedAt?: number
}

// ============ 配置常量 ============

const CONFIG = {
  /** 数据库名称 */
  DB_NAME: 'StreamingCacheDB',
  /** 数据库版本 */
  DB_VERSION: 1,
  /** 默认过期时间（30分钟） */
  DEFAULT_MAX_AGE_MS: 30 * 60 * 1000,
  /** 会话超时时间（30分钟） */
  SESSION_TIMEOUT_MS: 30 * 60 * 1000,
  /** 最大缓存会话数 */
  MAX_CACHED_SESSIONS: 50
}

// ============ 数据库定义 ============

/**
 * 流式缓存数据库类
 */
class StreamingCacheDatabase extends Dexie {
  sessions!: Table<StreamSession, string>

  constructor() {
    super(CONFIG.DB_NAME)
    
    this.version(CONFIG.DB_VERSION).stores({
      sessions: 'sessionId, userId, status, createdAt, updatedAt'
    })
  }
}

// 创建数据库单例
let dbInstance: StreamingCacheDatabase | null = null

/**
 * 获取数据库实例（懒加载）
 */
function getDB(): StreamingCacheDatabase {
  if (!dbInstance) {
    dbInstance = new StreamingCacheDatabase()
  }
  return dbInstance
}

// ============ 核心API实现 ============

/**
 * 创建新的流式会话
 */
export async function createSession(
  sessionId: string,
  userId: string,
  query: string
): Promise<void> {
  const db = getDB()
  const now = Date.now()
  
  const session: StreamSession = {
    sessionId,
    userId,
    query,
    content: '',
    structuredData: [],
    status: 'streaming',
    currentStep: 0,
    currentStepMessage: '',
    createdAt: now,
    updatedAt: now
  }
  
  try {
    await db.sessions.put(session)
    console.log(`[StreamCache] 创建会话: ${sessionId}`)
  } catch (error: any) {
    console.error('[StreamCache] 创建会话失败:', error)
    throw new Error(`创建会话失败: ${error.message}`)
  }
}

/**
 * 追加流式内容
 */
export async function appendContent(
  sessionId: string,
  chunk: string
): Promise<void> {
  const db = getDB()
  
  try {
    await db.transaction('rw', db.sessions, async () => {
      const session = await db.sessions.get(sessionId)
      
      if (!session) {
        throw new Error(`会话不存在: ${sessionId}`)
      }
      
      if (session.status !== 'streaming') {
        console.warn(`[StreamCache] 会话已结束，忽略内容追加: ${sessionId}`)
        return
      }
      
      await db.sessions.update(sessionId, {
        content: session.content + chunk,
        updatedAt: Date.now()
      })
    })
  } catch (error: any) {
    console.error('[StreamCache] 追加内容失败:', error)
    throw error
  }
}

/**
 * 追加结构化数据
 */
export async function appendStructuredData(
  sessionId: string,
  type: string,
  data: any
): Promise<void> {
  const db = getDB()
  
  try {
    await db.transaction('rw', db.sessions, async () => {
      const session = await db.sessions.get(sessionId)
      
      if (!session) {
        throw new Error(`会话不存在: ${sessionId}`)
      }
      
      const newItem: StructuredDataItem = {
        type,
        data,
        receivedAt: Date.now()
      }
      
      await db.sessions.update(sessionId, {
        structuredData: [...session.structuredData, newItem],
        updatedAt: Date.now()
      })
    })
  } catch (error: any) {
    console.error('[StreamCache] 追加结构化数据失败:', error)
    throw error
  }
}

/**
 * 更新当前步骤
 */
export async function updateStep(
  sessionId: string,
  step: number,
  message: string
): Promise<void> {
  const db = getDB()
  
  try {
    await db.sessions.update(sessionId, {
      currentStep: step,
      currentStepMessage: message,
      updatedAt: Date.now()
    })
  } catch (error: any) {
    console.error('[StreamCache] 更新步骤失败:', error)
    throw error
  }
}

/**
 * 获取会话
 */
export async function getSession(
  sessionId: string
): Promise<StreamSession | null> {
  const db = getDB()
  
  try {
    const session = await db.sessions.get(sessionId)
    return session || null
  } catch (error: any) {
    console.error('[StreamCache] 获取会话失败:', error)
    return null
  }
}

/**
 * 获取用户最新的会话
 */
export async function getLatestSession(
  userId: string
): Promise<StreamSession | null> {
  const db = getDB()
  
  try {
    const sessions = await db.sessions
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('createdAt')
    
    return sessions.length > 0 ? sessions[0] : null
  } catch (error: any) {
    console.error('[StreamCache] 获取最新会话失败:', error)
    return null
  }
}

/**
 * 获取用户当前活跃的流式会话
 */
export async function getActiveSession(
  userId: string
): Promise<StreamSession | null> {
  const db = getDB()
  
  try {
    // 首先查找正在streaming的会话
    const streamingSessions = await db.sessions
      .where('userId')
      .equals(userId)
      .and(session => session.status === 'streaming')
      .toArray()
    
    if (streamingSessions.length > 0) {
      streamingSessions.sort((a, b) => b.updatedAt - a.updatedAt)
      return streamingSessions[0]
    }
    
    // 如果没有streaming会话，查找最近5分钟内完成的会话
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const completedSessions = await db.sessions
      .where('userId')
      .equals(userId)
      .and(session => 
        session.status === 'completed' && 
        (session.completedAt || session.updatedAt) > fiveMinutesAgo
      )
      .toArray()
    
    if (completedSessions.length > 0) {
      completedSessions.sort((a, b) => 
        (b.completedAt || b.updatedAt) - (a.completedAt || a.updatedAt)
      )
      return completedSessions[0]
    }
    
    return null
  } catch (error: any) {
    console.error('[StreamCache] 获取活跃会话失败:', error)
    return null
  }
}

/**
 * 标记会话为已完成
 */
export async function markCompleted(sessionId: string): Promise<void> {
  const db = getDB()
  const now = Date.now()
  
  try {
    await db.sessions.update(sessionId, {
      status: 'completed',
      updatedAt: now,
      completedAt: now
    })
    console.log(`[StreamCache] 会话完成: ${sessionId}`)
  } catch (error: any) {
    console.error('[StreamCache] 标记完成失败:', error)
    throw error
  }
}

/**
 * 标记会话为错误状态
 */
export async function markError(
  sessionId: string,
  errorMessage: string
): Promise<void> {
  const db = getDB()
  
  try {
    await db.sessions.update(sessionId, {
      status: 'error',
      errorMessage,
      updatedAt: Date.now()
    })
    console.log(`[StreamCache] 会话错误: ${sessionId} - ${errorMessage}`)
  } catch (error: any) {
    console.error('[StreamCache] 标记错误失败:', error)
    throw error
  }
}

/**
 * 标记会话为超时状态
 */
export async function markTimeout(sessionId: string): Promise<void> {
  const db = getDB()
  
  try {
    await db.sessions.update(sessionId, {
      status: 'timeout',
      errorMessage: '会话超时',
      updatedAt: Date.now()
    })
    console.log(`[StreamCache] 会话超时: ${sessionId}`)
  } catch (error: any) {
    console.error('[StreamCache] 标记超时失败:', error)
    throw error
  }
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDB()
  
  try {
    await db.sessions.delete(sessionId)
    console.log(`[StreamCache] 删除会话: ${sessionId}`)
  } catch (error: any) {
    console.error('[StreamCache] 删除会话失败:', error)
    throw error
  }
}

/**
 * 清理过期会话
 */
export async function cleanupExpiredSessions(
  maxAgeMs: number = CONFIG.DEFAULT_MAX_AGE_MS
): Promise<number> {
  const db = getDB()
  const cutoffTime = Date.now() - maxAgeMs
  
  try {
    const expiredSessions = await db.sessions
      .where('updatedAt')
      .below(cutoffTime)
      .toArray()
    
    if (expiredSessions.length === 0) {
      return 0
    }
    
    const sessionIds = expiredSessions.map(s => s.sessionId)
    await db.sessions.bulkDelete(sessionIds)
    
    console.log(`[StreamCache] 清理了 ${sessionIds.length} 个过期会话`)
    return sessionIds.length
  } catch (error: any) {
    console.error('[StreamCache] 清理过期会话失败:', error)
    return 0
  }
}

/**
 * 检查会话是否超时
 */
export function isSessionTimeout(session: StreamSession): boolean {
  if (session.status !== 'streaming') {
    return false
  }
  
  const elapsed = Date.now() - session.updatedAt
  return elapsed > CONFIG.SESSION_TIMEOUT_MS
}

/**
 * 检查并标记超时会话
 */
export async function checkAndMarkTimeoutSessions(
  userId: string
): Promise<number> {
  const db = getDB()
  
  try {
    const activeSessions = await db.sessions
      .where('userId')
      .equals(userId)
      .and(session => session.status === 'streaming')
      .toArray()
    
    let timeoutCount = 0
    
    for (const session of activeSessions) {
      if (isSessionTimeout(session)) {
        await markTimeout(session.sessionId)
        timeoutCount++
      }
    }
    
    return timeoutCount
  } catch (error: any) {
    console.error('[StreamCache] 检查超时会话失败:', error)
    return 0
  }
}

export { CONFIG as STREAM_CACHE_CONFIG }
