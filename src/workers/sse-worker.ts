/**
 * SSE Worker - 后台流式连接处理器
 * 
 * 在Web Worker中处理SSE连接，实现：
 * - 后台流式数据接收（不受页面生命周期影响）
 * - 自动重连机制（最多3次）
 * - 超时处理（60秒无响应）
 * - 资源清理
 * 
 * @author BUILD_BODY v2.0
 * @migrated 2025-01-02 - 迁移到新项目
 */

// ============ 类型定义 ============

export type WorkerMessageType = 'START' | 'STOP' | 'STATUS'
export type WorkerResponseType = 
  | 'CHUNK' 
  | 'STEP' 
  | 'STRUCTURED_DATA' 
  | 'DONE' 
  | 'ERROR' 
  | 'STATUS' 
  | 'RECONNECTING'
  | 'TIMEOUT'
  | 'RATE_LIMIT'

export interface WorkerMessage {
  type: WorkerMessageType
  payload?: {
    url: string
    body: {
      user_id: string
      query: string
      session_id?: string
      domain?: string
    }
    sessionId?: string
    token?: string
  }
}

export interface WorkerResponse {
  type: WorkerResponseType
  payload: {
    sessionId?: string
    content?: string
    step?: number
    stepMessage?: string
    dataType?: string
    data?: any
    error?: string
    status?: 'idle' | 'connected' | 'disconnected' | 'reconnecting' | 'error'
    reconnectCount?: number
    totalLength?: number
    durationMs?: number
    requestId?: string
    retryAfter?: number
  }
}

interface SSEEvent {
  type: 'step' | 'chunk' | 'structured_data' | 'done' | 'error' | 'fallback' | 'rate_limit'
  step?: number
  message?: string
  content?: string
  data_type?: string
  data?: any
  error?: string
  retry_after?: number
  request_id?: string
  total_length?: number
  duration_ms?: number
}

interface WorkerState {
  isConnected: boolean
  sessionId: string | null
  reconnectCount: number
  lastChunkTime: number
  abortController: AbortController | null
  timeoutTimer: number | null
  reconnectTimer: number | null
}

// ============ 配置常量 ============

const CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY_MS: 2000,
  TIMEOUT_MS: 60000,
}

// ============ Worker状态 ============

const state: WorkerState = {
  isConnected: false,
  sessionId: null,
  reconnectCount: 0,
  lastChunkTime: 0,
  abortController: null,
  timeoutTimer: null,
  reconnectTimer: null
}

let currentRequestParams: WorkerMessage['payload'] | null = null

// ============ 工具函数 ============

function postResponse(response: WorkerResponse): void {
  self.postMessage(response)
}

function log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
  const prefix = `[SSE-Worker]`
  const timestamp = new Date().toISOString()
  
  if (data) {
    console[level](`${timestamp} ${prefix} ${message}`, data)
  } else {
    console[level](`${timestamp} ${prefix} ${message}`)
  }
}

function updateLastChunkTime(): void {
  state.lastChunkTime = Date.now()
}

function resetTimeoutTimer(): void {
  if (state.timeoutTimer !== null) {
    clearTimeout(state.timeoutTimer)
    state.timeoutTimer = null
  }
  
  state.timeoutTimer = self.setTimeout(() => {
    handleTimeout()
  }, CONFIG.TIMEOUT_MS) as unknown as number
}

function clearTimeoutTimer(): void {
  if (state.timeoutTimer !== null) {
    clearTimeout(state.timeoutTimer)
    state.timeoutTimer = null
  }
}

function clearReconnectTimer(): void {
  if (state.reconnectTimer !== null) {
    clearTimeout(state.reconnectTimer)
    state.reconnectTimer = null
  }
}

// ============ 核心功能 ============

function handleTimeout(): void {
  log('warn', '流式传输超时（60秒无响应）')
  
  if (state.abortController) {
    state.abortController.abort()
    state.abortController = null
  }
  
  state.isConnected = false
  
  postResponse({
    type: 'TIMEOUT',
    payload: {
      sessionId: state.sessionId || undefined,
      error: '流式传输超时（60秒无响应）',
      status: 'error'
    }
  })
  
  cleanup()
}

function handleSSEEvent(event: SSEEvent): void {
  updateLastChunkTime()
  resetTimeoutTimer()
  
  log('info', `收到SSE事件: ${event.type}`)
  
  switch (event.type) {
    case 'step':
      postResponse({
        type: 'STEP',
        payload: {
          sessionId: state.sessionId || undefined,
          step: event.step,
          stepMessage: event.message
        }
      })
      break
    
    case 'chunk':
      if (event.content) {
        postResponse({
          type: 'CHUNK',
          payload: {
            sessionId: state.sessionId || undefined,
            content: event.content
          }
        })
      }
      break
    
    case 'structured_data':
      if (event.data) {
        postResponse({
          type: 'STRUCTURED_DATA',
          payload: {
            sessionId: state.sessionId || undefined,
            dataType: event.data_type || 'unknown',
            data: event.data
          }
        })
      }
      break
    
    case 'done':
      log('info', '流式传输完成')
      state.isConnected = false
      clearTimeoutTimer()
      
      postResponse({
        type: 'DONE',
        payload: {
          sessionId: state.sessionId || undefined,
          status: 'disconnected',
          totalLength: event.total_length,
          durationMs: event.duration_ms,
          requestId: event.request_id
        }
      })
      
      cleanup()
      break
    
    case 'error':
      log('error', '收到错误事件', event.error)
      state.isConnected = false
      clearTimeoutTimer()
      
      postResponse({
        type: 'ERROR',
        payload: {
          sessionId: state.sessionId || undefined,
          error: event.error || '未知错误',
          status: 'error'
        }
      })
      
      cleanup()
      break
    
    case 'rate_limit':
      log('warn', '并发限制', event)
      state.isConnected = false
      clearTimeoutTimer()
      
      postResponse({
        type: 'RATE_LIMIT',
        payload: {
          sessionId: state.sessionId || undefined,
          error: event.message || '服务繁忙，请稍后重试',
          retryAfter: event.retry_after,
          status: 'error'
        }
      })
      
      cleanup()
      break
  }
}

async function attemptReconnect(): Promise<void> {
  if (state.reconnectCount >= CONFIG.MAX_RECONNECT_ATTEMPTS) {
    log('error', `重连失败，已达到最大重试次数 (${CONFIG.MAX_RECONNECT_ATTEMPTS})`)
    
    postResponse({
      type: 'ERROR',
      payload: {
        sessionId: state.sessionId || undefined,
        error: `连接失败（已重试${CONFIG.MAX_RECONNECT_ATTEMPTS}次）`,
        status: 'error',
        reconnectCount: state.reconnectCount
      }
    })
    
    cleanup()
    return
  }
  
  state.reconnectCount++
  log('info', `尝试重连 (${state.reconnectCount}/${CONFIG.MAX_RECONNECT_ATTEMPTS})...`)
  
  postResponse({
    type: 'RECONNECTING',
    payload: {
      sessionId: state.sessionId || undefined,
      status: 'reconnecting',
      reconnectCount: state.reconnectCount
    }
  })
  
  state.reconnectTimer = self.setTimeout(async () => {
    if (currentRequestParams) {
      await startStream(currentRequestParams)
    }
  }, CONFIG.RECONNECT_DELAY_MS) as unknown as number
}

async function startStream(params: WorkerMessage['payload']): Promise<void> {
  if (!params) {
    log('error', '缺少请求参数')
    postResponse({
      type: 'ERROR',
      payload: {
        error: '缺少请求参数',
        status: 'error'
      }
    })
    return
  }
  
  currentRequestParams = params
  state.sessionId = params.sessionId || `session_${Date.now()}`
  
  log('info', `开始流式连接: ${params.url}`, { sessionId: state.sessionId })
  
  state.abortController = new AbortController()
  resetTimeoutTimer()
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    }
    
    if (params.token) {
      headers['Authorization'] = `Bearer ${params.token}`
    }
    
    const response = await fetch(params.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params.body),
      signal: state.abortController.signal
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    if (!response.body) {
      throw new Error('响应体为空')
    }
    
    state.isConnected = true
    state.reconnectCount = 0
    updateLastChunkTime()
    
    postResponse({
      type: 'STATUS',
      payload: {
        sessionId: state.sessionId,
        status: 'connected'
      }
    })
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      
      if (done) {
        log('info', '流读取完成')
        break
      }
      
      buffer += decoder.decode(value, { stream: true })
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          
          if (data === '[DONE]') {
            log('info', '收到完成标记 [DONE]')
            continue
          }
          
          try {
            const event: SSEEvent = JSON.parse(data)
            handleSSEEvent(event)
          } catch (parseErr) {
            log('warn', '解析SSE事件失败', { data, error: parseErr })
          }
        }
      }
    }
    
    if (state.isConnected) {
      state.isConnected = false
      clearTimeoutTimer()
      
      postResponse({
        type: 'DONE',
        payload: {
          sessionId: state.sessionId || undefined,
          status: 'disconnected'
        }
      })
    }
    
  } catch (err: any) {
    if (err.name === 'AbortError') {
      log('info', '请求被取消')
      return
    }
    
    log('error', '流式连接失败', err)
    state.isConnected = false
    clearTimeoutTimer()
    
    await attemptReconnect()
  }
}

function stopStream(): void {
  log('info', '停止流式连接')
  
  if (state.abortController) {
    state.abortController.abort()
    state.abortController = null
  }
  
  cleanup()
  
  postResponse({
    type: 'STATUS',
    payload: {
      sessionId: state.sessionId || undefined,
      status: 'disconnected'
    }
  })
}

function getStatus(): void {
  postResponse({
    type: 'STATUS',
    payload: {
      sessionId: state.sessionId || undefined,
      status: state.isConnected ? 'connected' : 'idle',
      reconnectCount: state.reconnectCount
    }
  })
}

function cleanup(): void {
  log('info', '清理资源')
  
  clearTimeoutTimer()
  clearReconnectTimer()
  
  if (state.abortController) {
    state.abortController.abort()
    state.abortController = null
  }
  
  state.isConnected = false
  state.sessionId = null
  state.reconnectCount = 0
  state.lastChunkTime = 0
  currentRequestParams = null
}

// ============ 消息处理 ============

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data
  
  log('info', `收到主线程消息: ${message.type}`)
  
  switch (message.type) {
    case 'START':
      if (state.isConnected || state.abortController) {
        stopStream()
      }
      await startStream(message.payload)
      break
    
    case 'STOP':
      stopStream()
      break
    
    case 'STATUS':
      getStatus()
      break
    
    default:
      log('warn', `未知消息类型: ${(message as any).type}`)
  }
}

self.onerror = (event: ErrorEvent) => {
  log('error', 'Worker错误', event)
  
  postResponse({
    type: 'ERROR',
    payload: {
      sessionId: state.sessionId || undefined,
      error: event.message || 'Worker内部错误',
      status: 'error'
    }
  })
  
  cleanup()
}

log('info', 'SSE Worker 已启动')

export type { SSEEvent }
