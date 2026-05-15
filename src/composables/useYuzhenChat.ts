/**
 * useYuzhenChat — Vue3 composable for YuzhenFork Studio WebSocket 对话
 *
 * 协议：ws://<host>/api/sessions/:id/chat?resumeFromSeq=N
 * 事件：session:snapshot / session:state / session:message / session:stream / session:error
 */
import { ref, computed, onUnmounted, type Ref } from 'vue'

// === 类型定义 ===

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: number
  seq?: number
  toolCalls?: ToolCallInfo[]
  thinking?: ThinkingBlock[]
  isStreaming?: boolean
  runtime?: {
    providerId?: string
    providerName?: string
    modelId?: string
    usage?: { input_tokens: number; output_tokens: number }
  }
}

export interface ToolCallInfo {
  id: string
  toolName: string
  status?: 'pending' | 'running' | 'success' | 'error'
  summary?: string
  input?: unknown
  result?: unknown
  output?: string
  error?: string
  exitCode?: number
  duration?: number
  confirmationRequired?: boolean
  confirmation?: {
    id: string
    reason: string
    suggestion?: string
  }
}

export interface ThinkingBlock {
  content: string
  summary?: string
}

export interface SessionInfo {
  id: string
  title?: string
  status: string
  narratorState?: 'idle' | 'working'
  agentId?: string
  sessionConfig?: {
    providerId?: string
    modelId?: string
    permissionMode?: string
  }
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

// === Composable ===

export function useYuzhenChat(baseUrl?: string) {
  const defaultWsUrl = (import.meta.env.VITE_YUZHENFORK_URL || 'http://localhost:4568')
    .replace(/^http/, 'ws')
  const wsBaseUrl = baseUrl || defaultWsUrl

  // 状态
  const messages: Ref<ChatMessage[]> = ref([])
  const session: Ref<SessionInfo | null> = ref(null)
  const connectionState: Ref<ConnectionState> = ref('disconnected')
  const isWorking = ref(false)
  const streamingContent = ref('')
  const error: Ref<string | null> = ref(null)
  const lastSeq = ref(0)

  // 内部
  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let currentSessionId: string | null = null

  // === 连接管理 ===

  function connect(sessionId: string, resumeFromSeq?: number) {
    disconnect()
    currentSessionId = sessionId
    connectionState.value = 'connecting'
    error.value = null

    const url = resumeFromSeq
      ? `${wsBaseUrl}/api/sessions/${sessionId}/chat?resumeFromSeq=${resumeFromSeq}`
      : `${wsBaseUrl}/api/sessions/${sessionId}/chat`

    ws = new WebSocket(url)

    ws.onopen = () => {
      connectionState.value = 'connected'
      error.value = null
    }

    ws.onmessage = (event) => {
      handleServerMessage(event.data)
    }

    ws.onerror = () => {
      error.value = '连接错误'
    }

    ws.onclose = (event) => {
      connectionState.value = 'disconnected'
      if (!event.wasClean && currentSessionId) {
        scheduleReconnect()
      }
    }
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws) {
      ws.close(1000, 'client disconnect')
      ws = null
    }
    currentSessionId = null
    connectionState.value = 'disconnected'
    streamingContent.value = ''
  }

  function scheduleReconnect() {
    if (reconnectTimer) return
    connectionState.value = 'reconnecting'
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      if (currentSessionId) {
        connect(currentSessionId, lastSeq.value || undefined)
      }
    }, 3000)
  }

  // === 发送消息 ===

  function sendMessage(content: string) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      error.value = '未连接'
      return
    }

    // 不在本地添加 user message — 等服务端 session:message 回传（避免重复）
    streamingContent.value = ''
    isWorking.value = true

    // 发送到服务端
    ws.send(JSON.stringify({
      type: 'session:message',
      content,
      ack: lastSeq.value,
    }))
  }

  function abort() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'session:abort' }))
  }

  function ack(seq: number) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'session:ack', ack: seq }))
  }

  // === 处理服务端消息 ===

  function handleServerMessage(raw: string) {
    let envelope: any
    try {
      envelope = JSON.parse(raw)
    } catch {
      return
    }

    switch (envelope.type) {
      case 'session:snapshot':
        handleSnapshot(envelope)
        break
      case 'session:state':
        handleState(envelope)
        break
      case 'session:message':
        handleMessage(envelope)
        break
      case 'session:stream':
        handleStream(envelope)
        break
      case 'session:error':
        handleError(envelope)
        break
    }
  }

  function handleSnapshot(envelope: any) {
    const { snapshot } = envelope
    if (snapshot.session) {
      session.value = {
        id: snapshot.session.id,
        title: snapshot.session.title,
        status: snapshot.session.status,
        narratorState: snapshot.session.narratorState,
        agentId: snapshot.session.agentId,
        sessionConfig: snapshot.session.sessionConfig,
      }
    }
    if (snapshot.messages) {
      messages.value = snapshot.messages.map(mapServerMessage)
    }
    if (snapshot.cursor) {
      lastSeq.value = snapshot.cursor.lastSeq || 0
    }
  }

  function handleState(envelope: any) {
    if (envelope.session) {
      const s = envelope.session
      session.value = {
        ...session.value,
        id: s.id,
        title: s.title,
        status: s.status,
        narratorState: s.narratorState,
      } as SessionInfo
      isWorking.value = s.narratorState === 'working'
    }
    if (envelope.cursor) {
      lastSeq.value = envelope.cursor.lastSeq || lastSeq.value
    }
  }

  function handleMessage(envelope: any) {
    const msg = mapServerMessage(envelope.message)

    // 如果有流式内容，合并到最终消息
    if (msg.role === 'assistant' && streamingContent.value) {
      msg.content = msg.content || streamingContent.value
      streamingContent.value = ''
    }

    // 替换或追加消息
    const existingIdx = messages.value.findIndex(m => m.id === msg.id)
    if (existingIdx >= 0) {
      const updated = [...messages.value]
      updated[existingIdx] = msg
      messages.value = updated
    } else {
      messages.value = [...messages.value, msg]
    }

    if (envelope.cursor) {
      lastSeq.value = envelope.cursor.lastSeq || lastSeq.value
    }
  }

  function handleStream(envelope: any) {
    streamingContent.value += envelope.content || ''
  }

  function handleError(envelope: any) {
    error.value = envelope.error || '未知错误'
    isWorking.value = false
  }

  // === 消息映射 ===

  function mapServerMessage(raw: any): ChatMessage {
    const msg: ChatMessage = {
      id: raw.id || `msg-${Date.now()}-${Math.random()}`,
      role: raw.role || 'assistant',
      content: raw.content || '',
      timestamp: raw.timestamp || Date.now(),
      seq: raw.seq,
    }

    // 工具调用
    if (raw.toolCalls && raw.toolCalls.length > 0) {
      msg.toolCalls = raw.toolCalls.map((tc: any) => ({
        id: tc.id || tc.toolName,
        toolName: tc.toolName,
        status: tc.status || 'success',
        summary: tc.summary,
        input: tc.input,
        result: tc.result,
        output: tc.output,
        error: tc.error,
        exitCode: tc.exitCode,
        duration: tc.duration || tc.durationMs,
        confirmationRequired: tc.confirmationRequired,
        confirmation: tc.confirmation,
      }))
    }

    // Runtime 信息
    if (raw.runtime) {
      msg.runtime = {
        providerId: raw.runtime.providerId,
        providerName: raw.runtime.providerName,
        modelId: raw.runtime.modelId,
        usage: raw.runtime.usage,
      }
    }

    return msg
  }

  // === 计算属性 ===

  const isConnected = computed(() => connectionState.value === 'connected')
  const isStreaming = computed(() => isWorking.value && streamingContent.value.length > 0)

  // === 清理 ===

  onUnmounted(() => {
    disconnect()
  })

  return {
    // 状态
    messages,
    session,
    connectionState,
    isConnected,
    isWorking,
    isStreaming,
    streamingContent,
    error,
    lastSeq,

    // 方法
    connect,
    disconnect,
    sendMessage,
    abort,
    ack,
  }
}
