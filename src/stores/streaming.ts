/**
 * Streaming Store - 全局流式状态管理
 * 
 * 用于在应用全局范围内管理流式响应状态，
 * 支持导航指示器显示和跨页面状态同步。
 * 
 * @author 玉珍健身 v3.0
 * @created 2025-01-02
 * @spec yuzhen-fitness-feature-migration - TASK-4.2
 * @requirements 4.1, 4.2, 4.3
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as streamCache from '@/utils/streaming-cache'

export type StreamingStatus = 'idle' | 'streaming' | 'completed' | 'error'

export interface StreamingState {
  status: StreamingStatus
  sessionId: string | null
  userId: string | null
  query: string | null
  contentLength: number
  startTime: number | null
  hasNewContent: boolean
  errorMessage: string | null
}

/**
 * Streaming Store
 * 全局流式状态管理，用于导航指示器和跨页面状态同步
 */
export const useStreamingStore = defineStore('streaming', () => {
  // ========== State ==========
  const status = ref<StreamingStatus>('idle')
  const sessionId = ref<string | null>(null)
  const userId = ref<string | null>(null)
  const query = ref<string | null>(null)
  const contentLength = ref(0)
  const startTime = ref<number | null>(null)
  const hasNewContent = ref(false)
  const errorMessage = ref<string | null>(null)
  
  // 用于跟踪用户是否在聊天页面
  const isOnChatPage = ref(false)

  // ========== Computed ==========
  
  /**
   * 是否正在流式传输
   */
  const isStreaming = computed(() => status.value === 'streaming')
  
  /**
   * 是否有活跃的流式会话（正在进行或刚完成）
   */
  const hasActiveSession = computed(() => 
    status.value === 'streaming' || 
    (status.value === 'completed' && hasNewContent.value)
  )
  
  /**
   * 是否应该显示导航指示器
   * 只有在不在聊天页面且有活跃会话时才显示
   */
  const shouldShowIndicator = computed(() => 
    !isOnChatPage.value && hasActiveSession.value
  )
  
  /**
   * 流式持续时间（秒）
   */
  const duration = computed(() => {
    if (!startTime.value) return 0
    return Math.floor((Date.now() - startTime.value) / 1000)
  })
  
  /**
   * 获取当前状态快照
   */
  const state = computed<StreamingState>(() => ({
    status: status.value,
    sessionId: sessionId.value,
    userId: userId.value,
    query: query.value,
    contentLength: contentLength.value,
    startTime: startTime.value,
    hasNewContent: hasNewContent.value,
    errorMessage: errorMessage.value
  }))

  // ========== Actions ==========
  
  /**
   * 开始流式会话
   */
  function startStreaming(params: {
    sessionId: string
    userId: string
    query: string
  }) {
    sessionId.value = params.sessionId
    userId.value = params.userId
    query.value = params.query
    status.value = 'streaming'
    startTime.value = Date.now()
    contentLength.value = 0
    hasNewContent.value = true
    errorMessage.value = null
    
    console.log('[StreamingStore] 开始流式会话:', params.sessionId)
  }
  
  /**
   * 更新内容长度
   */
  function updateContentLength(length: number) {
    contentLength.value = length
    hasNewContent.value = true
  }
  
  /**
   * 标记流式完成
   */
  function markCompleted() {
    status.value = 'completed'
    hasNewContent.value = true
    
    console.log('[StreamingStore] 流式完成:', sessionId.value)
  }
  
  /**
   * 标记流式错误
   */
  function markError(error: string) {
    status.value = 'error'
    errorMessage.value = error
    
    console.log('[StreamingStore] 流式错误:', error)
  }
  
  /**
   * 标记新内容已查看
   */
  function markContentViewed() {
    hasNewContent.value = false
  }
  
  /**
   * 设置是否在聊天页面
   */
  function setOnChatPage(value: boolean) {
    isOnChatPage.value = value
    
    // 如果进入聊天页面，标记内容已查看
    if (value) {
      hasNewContent.value = false
    }
  }
  
  /**
   * 重置状态
   */
  function reset() {
    status.value = 'idle'
    sessionId.value = null
    userId.value = null
    query.value = null
    contentLength.value = 0
    startTime.value = null
    hasNewContent.value = false
    errorMessage.value = null
  }
  
  /**
   * 从IndexedDB恢复状态
   */
  async function restoreFromCache(userIdParam: string): Promise<boolean> {
    try {
      // 检查并标记超时会话
      await streamCache.checkAndMarkTimeoutSessions(userIdParam)
      
      // 获取活跃会话
      const activeSession = await streamCache.getActiveSession(userIdParam)
      
      if (activeSession) {
        sessionId.value = activeSession.sessionId
        userId.value = activeSession.userId
        query.value = activeSession.query
        contentLength.value = activeSession.content.length
        startTime.value = activeSession.createdAt
        
        if (activeSession.status === 'streaming') {
          status.value = 'streaming'
          hasNewContent.value = true
        } else if (activeSession.status === 'completed') {
          status.value = 'completed'
          hasNewContent.value = true
        } else if (activeSession.status === 'error' || activeSession.status === 'timeout') {
          status.value = 'error'
          errorMessage.value = activeSession.errorMessage || '会话异常'
        }
        
        console.log('[StreamingStore] 从缓存恢复状态:', activeSession.sessionId)
        return true
      }
      
      return false
    } catch (err) {
      console.error('[StreamingStore] 恢复状态失败:', err)
      return false
    }
  }

  // ========== Return ==========
  return {
    // State
    status,
    sessionId,
    userId,
    query,
    contentLength,
    startTime,
    hasNewContent,
    errorMessage,
    isOnChatPage,
    
    // Computed
    isStreaming,
    hasActiveSession,
    shouldShowIndicator,
    duration,
    state,
    
    // Actions
    startStreaming,
    updateContentLength,
    markCompleted,
    markError,
    markContentViewed,
    setOnChatPage,
    reset,
    restoreFromCache
  }
})
