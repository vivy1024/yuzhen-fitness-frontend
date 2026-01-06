/**
 * useChatStream - SSE流式聊天Composable（增强版）
 * 
 * 功能：
 * - 通过Web Worker在后台处理SSE连接（不受页面生命周期影响）
 * - 使用IndexedDB持久化流式内容（支持页面刷新恢复）
 * - 实现暂停/恢复功能
 * - 自动重连机制（最多3次）
 * - 状态订阅机制
 * 
 * @author 玉珍健身 v3.0
 * @created 2025-01-02
 * @spec yuzhen-fitness-feature-migration - TASK-4.2
 * @requirements 1.1, 1.3, 1.4, 2.4
 */

import { ref, computed, watch } from 'vue'
import { useToast } from '@/components/ui/toast'
import { marked } from 'marked'
import type { WorkerMessage, WorkerResponse } from '@/workers/sse-worker'
import * as streamCache from '@/utils/streaming-cache'
import { useStreamingStore } from '@/stores/streaming'

// ============ 类型定义 ============

export type SSEEventType = 'step' | 'chunk' | 'structured_data' | 'done' | 'error' | 'fallback' | 'rate_limit'

export interface SSEEvent {
  type: SSEEventType
  step?: number
  message?: string
  content?: string
  data_type?: string
  data?: any
  error?: string
  retry_after?: number
}

export interface StreamState {
  isStreaming: boolean
  streamedContent: string
  structuredData: any[]
  error: string | null
  currentStep: number
  currentStepMessage: string
  totalLength: number
  duration: number
  requestId: string
  workerStatus: WorkerStatus
  sessionId: string | null
}

export type WorkerStatus = 'idle' | 'connected' | 'disconnected' | 'reconnecting' | 'error'

export interface SendMessageParams {
  userId: string
  query: string
  sessionId?: string
  topicId?: string  // 话题ID，用于多轮对话
  domain?: string
}

export type StateSubscriber = (state: StreamState) => void

// ============ Marked配置 ============

marked.setOptions({
  breaks: true,
  gfm: true
})

// ============ 兼容性检测 ============

function isSSESupportedFn(): boolean {
  return typeof EventSource !== 'undefined'
}

function isFetchSupportedFn(): boolean {
  return typeof fetch !== 'undefined'
}

function isReadableStreamSupportedFn(): boolean {
  return typeof ReadableStream !== 'undefined'
}

function isStreamingSupportedFn(): boolean {
  return isFetchSupportedFn() && isReadableStreamSupportedFn()
}

function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined'
}

// 导出兼容性检测函数
export const isSSESupported = isSSESupportedFn
export const isFetchSupported = isFetchSupportedFn
export const isReadableStreamSupported = isReadableStreamSupportedFn
export const isStreamingSupported = isStreamingSupportedFn

// ============ Worker管理 ============

let sseWorker: Worker | null = null
let workerInitialized = false

function getSSEWorker(): Worker | null {
  if (!isWorkerSupported()) {
    console.warn('[useChatStream] 浏览器不支持Web Worker')
    return null
  }
  
  if (!sseWorker && !workerInitialized) {
    try {
      sseWorker = new Worker(
        new URL('@/workers/sse-worker.ts', import.meta.url),
        { type: 'module' }
      )
      workerInitialized = true
      console.log('[useChatStream] SSE Worker已创建')
    } catch (err) {
      console.error('[useChatStream] 创建SSE Worker失败:', err)
      workerInitialized = true
    }
  }
  
  return sseWorker
}

function destroySSEWorker(): void {
  if (sseWorker) {
    sseWorker.terminate()
    sseWorker = null
    workerInitialized = false
    console.log('[useChatStream] SSE Worker已销毁')
  }
}

// ============ Composable ============

export function useChatStream() {
  const { toast } = useToast()
  
  // ===== 状态管理 =====
  const isStreaming = ref(false)
  const streamedContent = ref('')
  const structuredData = ref<any[]>([])
  const error = ref<string | null>(null)
  const currentStep = ref(0)
  const currentStepMessage = ref('')
  const totalLength = ref(0)
  const duration = ref(0)
  const requestId = ref('')
  const workerStatus = ref<WorkerStatus>('idle')
  const currentSessionId = ref<string | null>(null)
  const isStreamingSupportedRef = ref(true)
  const compatibilityWarning = ref<string | null>(null)
  
  const subscribers: Set<StateSubscriber> = new Set()
  let workerMessageHandler: ((event: MessageEvent<WorkerResponse>) => void) | null = null
  
  if (!isStreamingSupportedFn()) {
    isStreamingSupportedRef.value = false
    compatibilityWarning.value = '您的浏览器不支持流式输出，将使用标准模式'
  }

  // ===== 计算属性 =====
  
  const renderedContent = computed(() => {
    if (!streamedContent.value) return ''
    try {
      return marked.parse(streamedContent.value) as string
    } catch (err) {
      console.error('Markdown渲染失败:', err)
      return streamedContent.value
    }
  })
  
  const streamState = computed<StreamState>(() => ({
    isStreaming: isStreaming.value,
    streamedContent: streamedContent.value,
    structuredData: structuredData.value,
    error: error.value,
    currentStep: currentStep.value,
    currentStepMessage: currentStepMessage.value,
    totalLength: totalLength.value,
    duration: duration.value,
    requestId: requestId.value,
    workerStatus: workerStatus.value,
    sessionId: currentSessionId.value
  }))
  
  const hasError = computed(() => error.value !== null)
  const isDone = computed(() => !isStreaming.value && streamedContent.value.length > 0)

  // ===== 状态订阅机制 =====
  
  function notifySubscribers(): void {
    const state = streamState.value
    subscribers.forEach(callback => {
      try { callback(state) } catch (err) { console.error('[useChatStream] 订阅者回调错误:', err) }
    })
  }
  
  function subscribe(callback: StateSubscriber): () => void {
    subscribers.add(callback)
    callback(streamState.value)
    return () => { subscribers.delete(callback) }
  }
  
  watch([isStreaming, streamedContent, structuredData, error, currentStep, workerStatus], () => {
    notifySubscribers()
  }, { deep: true })

  // ===== Worker消息处理 =====
  
  function handleWorkerMessage(event: MessageEvent<WorkerResponse>): void {
    const response = event.data
    console.log('[useChatStream] Worker响应:', response.type, response.payload)
    
    switch (response.type) {
      case 'STATUS':
        workerStatus.value = response.payload.status || 'idle'
        break
      
      case 'CHUNK':
        if (response.payload.content) {
          streamedContent.value += response.payload.content
          if (currentSessionId.value) {
            streamCache.appendContent(currentSessionId.value, response.payload.content)
              .catch(err => console.error('[useChatStream] 缓存内容失败:', err))
          }
          // 同步内容长度到全局store
          try {
            const streamingStore = useStreamingStore()
            streamingStore.updateContentLength(streamedContent.value.length)
          } catch (e) { /* ignore */ }
        }
        break
      
      case 'STEP':
        if (response.payload.step !== undefined) {
          currentStep.value = response.payload.step
          currentStepMessage.value = response.payload.stepMessage || ''
          if (currentSessionId.value) {
            streamCache.updateStep(currentSessionId.value, response.payload.step, response.payload.stepMessage || '')
              .catch(err => console.error('[useChatStream] 更新步骤失败:', err))
          }
        }
        break
      
      case 'STRUCTURED_DATA':
        if (response.payload.data) {
          const item = { type: response.payload.dataType || 'unknown', data: response.payload.data }
          structuredData.value.push(item)
          if (currentSessionId.value) {
            streamCache.appendStructuredData(currentSessionId.value, item.type, item.data)
              .catch(err => console.error('[useChatStream] 缓存结构化数据失败:', err))
          }
        }
        break
      
      case 'DONE':
        isStreaming.value = false
        workerStatus.value = 'disconnected'
        totalLength.value = response.payload.totalLength || streamedContent.value.length
        duration.value = response.payload.durationMs || 0
        requestId.value = response.payload.requestId || ''
        if (currentSessionId.value) {
          streamCache.markCompleted(currentSessionId.value)
            .catch(err => console.error('[useChatStream] 标记完成失败:', err))
        }
        // 同步完成状态到全局store并显示通知
        try {
          const streamingStore = useStreamingStore()
          streamingStore.markCompleted()
          
          // 如果不在聊天页面，显示完成通知
          if (!streamingStore.isOnChatPage) {
            showStreamingCompleteNotification()
          } else {
            toast({ title: '回答生成完成', duration: 1000 })
          }
        } catch (e) {
          toast({ title: '回答生成完成', duration: 1000 })
        }
        break
      
      case 'ERROR':
        error.value = response.payload.error || '未知错误'
        isStreaming.value = false
        workerStatus.value = 'error'
        if (currentSessionId.value) {
          streamCache.markError(currentSessionId.value, error.value)
            .catch(err => console.error('[useChatStream] 标记错误失败:', err))
        }
        // 同步错误状态到全局store
        try {
          const streamingStore = useStreamingStore()
          streamingStore.markError(error.value)
        } catch (e) { /* ignore */ }
        toast({ title: '生成失败', description: error.value, variant: 'destructive' })
        break
      
      case 'RECONNECTING':
        workerStatus.value = 'reconnecting'
        toast({ title: `网络不稳定，正在重连 (${response.payload.reconnectCount}/3)...`, duration: 2000 })
        break
      
      case 'TIMEOUT':
        error.value = response.payload.error || '响应超时'
        isStreaming.value = false
        workerStatus.value = 'error'
        if (currentSessionId.value) {
          streamCache.markTimeout(currentSessionId.value).catch(err => console.error('[useChatStream] 标记超时失败:', err))
        }
        // 同步错误状态到全局store
        try {
          const streamingStore = useStreamingStore()
          streamingStore.markError(error.value)
        } catch (e) { /* ignore */ }
        toast({ title: '响应超时', description: '请重新发送', variant: 'destructive' })
        break
      
      case 'RATE_LIMIT':
        error.value = response.payload.error || '服务繁忙'
        isStreaming.value = false
        workerStatus.value = 'error'
        toast({ title: '服务繁忙', description: error.value, variant: 'destructive', duration: 3000 })
        break
      
      default:
        console.warn('[useChatStream] 未知Worker响应类型:', (response as any).type)
    }
  }

  // ===== 核心方法 =====
  
  /**
   * 通过Worker发送流式消息
   * @requirements 1.1
   */
  async function startStream(params: SendMessageParams): Promise<void> {
    // 获取全局streaming store
    const streamingStore = useStreamingStore()
    
    try {
      resetState()
      isStreaming.value = true
      
      const baseUrl = import.meta.env.VITE_DAML_RAG_API_URL || 'http://localhost:8001'
      
      // 兼容性检测
      if (!isStreamingSupportedRef.value) {
        console.warn('[useChatStream] 浏览器不支持流式，降级到非流式接口')
        await sendNonStreamMessage(baseUrl, params)
        return
      }
      
      // 生成会话ID
      const sessionId = params.sessionId || `stream_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      currentSessionId.value = sessionId
      
      // 创建缓存会话
      await streamCache.createSession(sessionId, params.userId, params.query)
      
      // 同步到全局streaming store
      streamingStore.startStreaming({
        sessionId,
        userId: params.userId,
        query: params.query
      })
      
      // 获取Worker
      const worker = getSSEWorker()
      
      if (worker) {
        // 使用Worker模式
        workerMessageHandler = handleWorkerMessage
        worker.addEventListener('message', workerMessageHandler)
        
        const url = `${baseUrl}/api/v1/chat/stream`
        const message: WorkerMessage = {
          type: 'START',
          payload: {
            url,
            body: {
              user_id: params.userId,
              query: params.query,
              session_id: sessionId,
              topic_id: params.topicId || null,  // 传递话题ID用于多轮对话
              domain: params.domain || 'fitness'
            },
            sessionId,
            token: localStorage.getItem('access_token') || undefined
          }
        }
        
        worker.postMessage(message)
        console.log('[useChatStream] 已发送START消息到Worker')
      } else {
        // 降级到直接Fetch模式
        console.warn('[useChatStream] Worker不可用，使用直接Fetch模式')
        await connectWithFetch(`${baseUrl}/api/v1/chat/stream`, {
          user_id: params.userId,
          query: params.query,
          session_id: sessionId,
          topic_id: params.topicId || null,  // 传递话题ID用于多轮对话
          domain: params.domain || 'fitness'
        })
      }
    } catch (err: any) {
      console.error('[useChatStream] 发送消息失败:', err)
      error.value = err.message || '发送消息失败'
      isStreaming.value = false
      toast({ title: '发送失败', description: error.value, variant: 'destructive' })
    }
  }

  /**
   * 停止流式传输
   */
  function stopStream(): void {
    const worker = getSSEWorker()
    if (worker && workerMessageHandler) {
      worker.postMessage({ type: 'STOP' } as WorkerMessage)
      worker.removeEventListener('message', workerMessageHandler)
      workerMessageHandler = null
    }
    isStreaming.value = false
    workerStatus.value = 'idle'
    console.log('[useChatStream] 流式传输已停止')
  }

  /**
   * 恢复会话 - 从IndexedDB加载已缓存的内容
   * @requirements 1.3, 2.4
   */
  async function resumeSession(sessionId: string): Promise<boolean> {
    try {
      console.log('[useChatStream] 尝试恢复会话:', sessionId)
      
      const session = await streamCache.getSession(sessionId)
      if (!session) {
        console.warn('[useChatStream] 会话不存在:', sessionId)
        return false
      }
      
      // 恢复状态
      currentSessionId.value = session.sessionId
      streamedContent.value = session.content
      structuredData.value = session.structuredData.map(item => ({
        type: item.type,
        data: item.data
      }))
      currentStep.value = session.currentStep
      currentStepMessage.value = session.currentStepMessage
      
      // 根据会话状态设置流式状态
      if (session.status === 'streaming') {
        isStreaming.value = true
        workerStatus.value = 'connected'
        
        // 检查是否超时
        if (streamCache.isSessionTimeout(session)) {
          await streamCache.markTimeout(sessionId)
          isStreaming.value = false
          workerStatus.value = 'error'
          error.value = '会话已超时'
          toast({ title: '会话已超时', description: '请重新发送', variant: 'destructive' })
          return true
        }
        
        toast({ title: '正在恢复对话...', duration: 1500 })
      } else if (session.status === 'completed') {
        isStreaming.value = false
        workerStatus.value = 'disconnected'
      } else if (session.status === 'error' || session.status === 'timeout') {
        isStreaming.value = false
        workerStatus.value = 'error'
        error.value = session.errorMessage || '会话异常'
      }
      
      console.log('[useChatStream] 会话恢复成功:', {
        sessionId,
        contentLength: session.content.length,
        status: session.status
      })
      
      return true
    } catch (err: any) {
      console.error('[useChatStream] 恢复会话失败:', err)
      return false
    }
  }

  /**
   * 尝试恢复用户最新的活跃会话
   * @requirements 1.3
   */
  async function tryResumeActiveSession(userId: string): Promise<boolean> {
    try {
      // 先检查并标记超时会话
      await streamCache.checkAndMarkTimeoutSessions(userId)
      
      // 获取活跃会话
      const activeSession = await streamCache.getActiveSession(userId)
      if (activeSession) {
        return await resumeSession(activeSession.sessionId)
      }
      
      // 如果没有活跃会话，尝试恢复最新的会话
      const latestSession = await streamCache.getLatestSession(userId)
      if (latestSession && latestSession.status === 'streaming') {
        return await resumeSession(latestSession.sessionId)
      }
      
      return false
    } catch (err: any) {
      console.error('[useChatStream] 尝试恢复活跃会话失败:', err)
      return false
    }
  }

  /**
   * 获取当前状态
   */
  function getState(): StreamState {
    return streamState.value
  }

  /**
   * 发送非流式消息（降级方案）
   */
  async function sendNonStreamMessage(baseUrl: string, params: SendMessageParams): Promise<void> {
    try {
      const url = `${baseUrl}/v1/chat`
      toast({ title: '使用标准模式生成回答...', duration: 2000 })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: params.userId,
          query: params.query,
          session_id: params.sessionId,
          domain: params.domain || 'fitness'
        })
      })
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      
      const result = await response.json()
      const content = result.data?.response || '抱歉，暂时无法生成回答'
      
      // 模拟流式显示
      const chunkSize = 50
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize)
        streamedContent.value += chunk
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      isStreaming.value = false
      totalLength.value = content.length
      toast({ title: '回答生成完成', duration: 1000 })
    } catch (err: any) {
      console.error('[useChatStream] 非流式请求失败:', err)
      error.value = err.message || '请求失败'
      isStreaming.value = false
      toast({ title: '请求失败', description: error.value, variant: 'destructive' })
    }
  }

  /**
   * 使用fetch + ReadableStream连接SSE（降级方案）
   */
  async function connectWithFetch(url: string, body: any): Promise<void> {
    let reconnectCount = 0
    const MAX_RECONNECT_ATTEMPTS = 3
    const RECONNECT_DELAY = 2000
    
    async function connect(): Promise<void> {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
          body: JSON.stringify(body)
        })
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        if (!response.body) throw new Error('响应体为空')
        
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              
              try {
                const event: SSEEvent = JSON.parse(data)
                handleSSEEvent(event)
              } catch (parseErr) {
                console.warn('[useChatStream] 解析SSE事件失败:', data, parseErr)
              }
            }
          }
        }
        
        isStreaming.value = false
      } catch (err: any) {
        console.error('[useChatStream] Fetch连接失败:', err)
        
        if (reconnectCount < MAX_RECONNECT_ATTEMPTS) {
          reconnectCount++
          toast({ title: `尝试重连 (${reconnectCount}/${MAX_RECONNECT_ATTEMPTS})...`, duration: 2000 })
          await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY))
          await connect()
        } else {
          error.value = `连接失败: ${err.message}`
          isStreaming.value = false
          toast({ title: '连接失败', description: `已重试${MAX_RECONNECT_ATTEMPTS}次`, variant: 'destructive' })
        }
      }
    }
    
    await connect()
  }

  /**
   * 处理SSE事件（Fetch模式）
   */
  function handleSSEEvent(event: SSEEvent): void {
    switch (event.type) {
      case 'step':
        if (event.step !== undefined) {
          currentStep.value = event.step
          currentStepMessage.value = event.message || ''
        }
        break
      
      case 'chunk':
        if (event.content) {
          streamedContent.value += event.content
          if (currentSessionId.value) {
            streamCache.appendContent(currentSessionId.value, event.content)
              .catch(err => console.error('[useChatStream] 缓存内容失败:', err))
          }
        }
        break
      
      case 'structured_data':
        if (event.data) {
          structuredData.value.push({ type: event.data_type || 'unknown', data: event.data })
        }
        break
      
      case 'done':
        isStreaming.value = false
        if (currentSessionId.value) {
          streamCache.markCompleted(currentSessionId.value)
            .catch(err => console.error('[useChatStream] 标记完成失败:', err))
        }
        toast({ title: '回答生成完成', duration: 1000 })
        break
      
      case 'error':
        error.value = event.error || '未知错误'
        isStreaming.value = false
        toast({ title: '生成失败', description: error.value, variant: 'destructive' })
        break
      
      case 'rate_limit':
        error.value = event.message || '服务繁忙，请稍后重试'
        isStreaming.value = false
        toast({ title: '服务繁忙', description: error.value, variant: 'destructive', duration: 3000 })
        break
    }
  }

  /**
   * 显示流式完成通知（带"查看回复"操作）
   * @requirements 4.3
   */
  function showStreamingCompleteNotification(): void {
    toast({
      title: 'AI回复已生成完成',
      description: '点击查看',
      duration: 5000,
      action: {
        label: '查看',
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.location.href = '/ai-chat'
          }
        }
      }
    })
  }

  /**
   * 重置状态
   */
  function resetState(): void {
    streamedContent.value = ''
    structuredData.value = []
    error.value = null
    currentStep.value = 0
    currentStepMessage.value = ''
    totalLength.value = 0
    duration.value = 0
    requestId.value = ''
    workerStatus.value = 'idle'
  }

  /**
   * 清理资源
   */
  function cleanup(): void {
    stopStream()
    resetState()
    currentSessionId.value = null
  }

  /**
   * 清理过期会话
   */
  async function cleanupExpiredSessions(maxAgeMs?: number): Promise<number> {
    return await streamCache.cleanupExpiredSessions(maxAgeMs)
  }

  /**
   * 兼容旧API - sendStreamMessage
   */
  async function sendStreamMessage(params: SendMessageParams): Promise<void> {
    return startStream(params)
  }

  // ===== 返回 =====
  
  return {
    // 状态
    isStreaming,
    streamedContent,
    structuredData,
    error,
    currentStep,
    currentStepMessage,
    totalLength,
    duration,
    requestId,
    workerStatus,
    currentSessionId,
    isStreamingSupported: isStreamingSupportedRef,
    compatibilityWarning,
    
    // 计算属性
    renderedContent,
    streamState,
    hasError,
    isDone,
    
    // 核心方法
    startStream,
    stopStream,
    resumeSession,
    tryResumeActiveSession,
    getState,
    subscribe,
    
    // 兼容旧API
    sendStreamMessage,
    
    // 工具方法
    resetState,
    cleanup,
    cleanupExpiredSessions
  }
}
