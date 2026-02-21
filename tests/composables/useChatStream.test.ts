/**
 * useChatStream Composable 单元测试
 * 覆盖：初始状态、兼容性检测、resetState、stopStream、startStream、
 *       handleWorkerMessage 各类型、subscribe/notifySubscribers、cleanup、
 *       renderedContent、hasError、isDone
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'

// ============ Mock 声明（vi.mock 会被 hoisted 到文件顶部） ============

const mockToast = vi.fn()
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

vi.mock('@/utils/streaming-cache', () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  appendContent: vi.fn().mockResolvedValue(undefined),
  updateStep: vi.fn().mockResolvedValue(undefined),
  appendStructuredData: vi.fn().mockResolvedValue(undefined),
  markCompleted: vi.fn().mockResolvedValue(undefined),
  markError: vi.fn().mockResolvedValue(undefined),
  markTimeout: vi.fn().mockResolvedValue(undefined),
  getSession: vi.fn().mockResolvedValue(null),
  getActiveSession: vi.fn().mockResolvedValue(null),
  getLatestSession: vi.fn().mockResolvedValue(null),
  checkAndMarkTimeoutSessions: vi.fn().mockResolvedValue(undefined),
  cleanupExpiredSessions: vi.fn().mockResolvedValue(0),
  isSessionTimeout: vi.fn().mockReturnValue(false),
}))

const mockStreamingStore = {
  updateContentLength: vi.fn(),
  markCompleted: vi.fn(),
  markError: vi.fn(),
  startStreaming: vi.fn(),
  isOnChatPage: true,
}
vi.mock('@/stores/streaming', () => ({
  useStreamingStore: () => mockStreamingStore,
}))

vi.mock('marked', () => ({
  marked: {
    setOptions: vi.fn(),
    parse: vi.fn((text: string) => `<p>${text}</p>`),
  },
}))

// ============ Mock Worker ============

class MockWorker {
  postMessage = vi.fn()
  terminate = vi.fn()
  private _listeners: Map<string, Set<Function>> = new Map()

  addEventListener(type: string, handler: Function) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, new Set())
    }
    this._listeners.get(type)!.add(handler)
  }

  removeEventListener(type: string, handler: Function) {
    this._listeners.get(type)?.delete(handler)
  }

  triggerMessage(data: any) {
    const event = { data } as MessageEvent
    this._listeners.get('message')?.forEach(fn => fn(event))
  }
}

// 全局 Worker 实例引用，供测试使用
let mockWorkerInstance: MockWorker | undefined

// 在文件顶层 stub 全局变量
vi.stubGlobal('Worker', function MockWorkerConstructor() {
  mockWorkerInstance = new MockWorker()
  return mockWorkerInstance
})
vi.stubGlobal('ReadableStream', class MockReadableStream {})
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({}),
  body: null,
}))
vi.stubGlobal('localStorage', {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
})

// ============ 测试套件 ============

describe('useChatStream', () => {
  // 每次测试前重置模块，确保 sseWorker 单例被清除
  // vi.stubGlobal 修改的是全局对象，不受 resetModules 影响
  beforeEach(async () => {
    vi.resetModules()
    mockWorkerInstance = undefined
    mockToast.mockClear()
    mockStreamingStore.updateContentLength.mockClear()
    mockStreamingStore.markCompleted.mockClear()
    mockStreamingStore.markError.mockClear()
    mockStreamingStore.startStreaming.mockClear()
    mockStreamingStore.isOnChatPage = true
    // 重新 stub，确保 resetModules 后新模块能看到正确的全局变量
    vi.stubGlobal('ReadableStream', class MockReadableStream {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
      body: null,
    }))
  })

  // 动态导入，每次测试拿到新的模块实例（sseWorker 单例被重置）
  async function getModule() {
    return import('@/composables/useChatStream')
  }

  // 辅助：启动 Worker 流并返回 composable 和 Worker 实例
  async function setupWorkerStream() {
    const { useChatStream } = await getModule()
    const composable = useChatStream()
    await composable.startStream({ userId: '1', query: '测试' })
    await nextTick()
    const worker = mockWorkerInstance!
    return { composable, worker }
  }

  // ============ 1. 初始状态 ============

  describe('初始状态', () => {
    it('isStreaming 初始值为 false', async () => {
      const { useChatStream } = await getModule()
      const { isStreaming } = useChatStream()
      expect(isStreaming.value).toBe(false)
    })

    it('streamedContent 初始值为空字符串', async () => {
      const { useChatStream } = await getModule()
      const { streamedContent } = useChatStream()
      expect(streamedContent.value).toBe('')
    })

    it('error 初始值为 null', async () => {
      const { useChatStream } = await getModule()
      const { error } = useChatStream()
      expect(error.value).toBeNull()
    })

    it('workerStatus 初始值为 idle', async () => {
      const { useChatStream } = await getModule()
      const { workerStatus } = useChatStream()
      expect(workerStatus.value).toBe('idle')
    })

    it('structuredData 初始值为空数组', async () => {
      const { useChatStream } = await getModule()
      const { structuredData } = useChatStream()
      expect(structuredData.value).toEqual([])
    })

    it('currentStep 初始值为 0', async () => {
      const { useChatStream } = await getModule()
      const { currentStep } = useChatStream()
      expect(currentStep.value).toBe(0)
    })
  })

  // ============ 2. 兼容性检测函数 ============

  describe('兼容性检测函数', () => {
    it('isSSESupported 在有 EventSource 时返回 true', async () => {
      vi.stubGlobal('EventSource', class {})
      const { isSSESupported } = await getModule()
      expect(isSSESupported()).toBe(true)
    })

    it('isSSESupported 在无 EventSource 时返回 false', async () => {
      vi.stubGlobal('EventSource', undefined)
      const { isSSESupported } = await getModule()
      expect(isSSESupported()).toBe(false)
    })

    it('isFetchSupported 在有 fetch 时返回 true', async () => {
      vi.stubGlobal('fetch', vi.fn())
      const { isFetchSupported } = await getModule()
      expect(isFetchSupported()).toBe(true)
    })

    it('isReadableStreamSupported 在有 ReadableStream 时返回 true', async () => {
      vi.stubGlobal('ReadableStream', class {})
      const { isReadableStreamSupported } = await getModule()
      expect(isReadableStreamSupported()).toBe(true)
    })

    it('isStreamingSupported 在 fetch 和 ReadableStream 都存在时返回 true', async () => {
      vi.stubGlobal('fetch', vi.fn())
      vi.stubGlobal('ReadableStream', class {})
      const { isStreamingSupported } = await getModule()
      expect(isStreamingSupported()).toBe(true)
    })

    it('isStreamingSupported 在缺少 ReadableStream 时返回 false', async () => {
      vi.stubGlobal('fetch', vi.fn())
      vi.stubGlobal('ReadableStream', undefined)
      const { isStreamingSupported } = await getModule()
      expect(isStreamingSupported()).toBe(false)
    })
  })

  // ============ 3. resetState ============

  describe('resetState', () => {
    it('调用后所有状态回到初始值', async () => {
      const { useChatStream } = await getModule()
      const { resetState, streamedContent, error, workerStatus, currentStep, structuredData } = useChatStream()

      streamedContent.value = '一些内容'
      error.value = '错误信息'
      workerStatus.value = 'error'
      currentStep.value = 3
      structuredData.value = [{ type: 'test', data: {} }]

      resetState()

      expect(streamedContent.value).toBe('')
      expect(error.value).toBeNull()
      expect(workerStatus.value).toBe('idle')
      expect(currentStep.value).toBe(0)
      expect(structuredData.value).toEqual([])
    })
  })

  // ============ 4. stopStream ============

  describe('stopStream', () => {
    it('调用后 isStreaming 为 false', async () => {
      const { useChatStream } = await getModule()
      const { stopStream, isStreaming } = useChatStream()
      isStreaming.value = true
      stopStream()
      expect(isStreaming.value).toBe(false)
    })

    it('调用后 workerStatus 为 idle', async () => {
      const { useChatStream } = await getModule()
      const { stopStream, workerStatus } = useChatStream()
      workerStatus.value = 'connected'
      stopStream()
      expect(workerStatus.value).toBe('idle')
    })
  })

  // ============ 5. startStream 参数构建 ============

  describe('startStream 参数构建', () => {
    it('Worker postMessage 包含正确的 payload 结构', async () => {
      const { composable, worker } = await setupWorkerStream()

      // 验证 postMessage 被调用（startStream 内部调用）
      expect(worker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'START',
          payload: expect.objectContaining({
            url: expect.stringContaining('/v1/chat/stream'),
            body: expect.objectContaining({
              user_id: 1,
              query: '测试',
            }),
          }),
        })
      )
    })

    it('startStream 传递 topicId 到 Worker payload', async () => {
      const { useChatStream } = await getModule()
      const { startStream } = useChatStream()

      await startStream({ userId: '1', query: '测试', topicId: 'topic-abc' })
      await nextTick()

      expect(mockWorkerInstance!.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            body: expect.objectContaining({ topic_id: 'topic-abc' }),
          }),
        })
      )
    })

    it('startStream 传递 personaId 到 Worker payload', async () => {
      const { useChatStream } = await getModule()
      const { startStream } = useChatStream()

      await startStream({ userId: '1', query: '测试', personaId: 'coach_professional' })
      await nextTick()

      expect(mockWorkerInstance!.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            body: expect.objectContaining({ persona_id: 'coach_professional' }),
          }),
        })
      )
    })

    it('startStream 默认 domain 为 fitness', async () => {
      const { useChatStream } = await getModule()
      const { startStream } = useChatStream()

      await startStream({ userId: '1', query: '测试' })
      await nextTick()

      expect(mockWorkerInstance!.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            body: expect.objectContaining({ domain: 'fitness', strategy: 'dag' }),
          }),
        })
      )
    })
  })

  // ============ 6. handleWorkerMessage 各类型 ============

  describe('handleWorkerMessage - CHUNK', () => {
    it('CHUNK 消息追加内容到 streamedContent', async () => {
      const { composable, worker } = await setupWorkerStream()

      worker.triggerMessage({ type: 'CHUNK', payload: { content: '你好' } })
      await nextTick()

      expect(composable.streamedContent.value).toContain('你好')
    })

    it('CHUNK 消息调用 updateContentLength', async () => {
      const { worker } = await setupWorkerStream()

      worker.triggerMessage({ type: 'CHUNK', payload: { content: 'hello' } })
      await nextTick()

      expect(mockStreamingStore.updateContentLength).toHaveBeenCalledWith(5)
    })
  })

  describe('handleWorkerMessage - STEP', () => {
    it('STEP 消息更新 currentStep 和 currentStepMessage', async () => {
      const { composable, worker } = await setupWorkerStream()

      worker.triggerMessage({ type: 'STEP', payload: { step: 2, stepMessage: '正在分析...' } })
      await nextTick()

      expect(composable.currentStep.value).toBe(2)
      expect(composable.currentStepMessage.value).toBe('正在分析...')
    })
  })

  describe('handleWorkerMessage - STRUCTURED_DATA', () => {
    it('STRUCTURED_DATA 消息追加到 structuredData', async () => {
      const { composable, worker } = await setupWorkerStream()

      worker.triggerMessage({
        type: 'STRUCTURED_DATA',
        payload: { dataType: 'exercise', data: { name: '深蹲' } },
      })
      await nextTick()

      expect(composable.structuredData.value).toHaveLength(1)
      expect(composable.structuredData.value[0].type).toBe('exercise')
      expect(composable.structuredData.value[0].data.name).toBe('深蹲')
    })
  })

  describe('handleWorkerMessage - DONE', () => {
    it('DONE 消息设置 isStreaming=false 和 workerStatus=disconnected', async () => {
      const { composable, worker } = await setupWorkerStream()

      worker.triggerMessage({ type: 'DONE', payload: { totalLength: 100, durationMs: 500, requestId: 'req-1' } })
      await nextTick()

      expect(composable.isStreaming.value).toBe(false)
      expect(composable.workerStatus.value).toBe('disconnected')
    })

    it('DONE 消息在聊天页面时调用 toast', async () => {
      mockStreamingStore.isOnChatPage = true
      const { worker } = await setupWorkerStream()

      mockToast.mockClear()
      worker.triggerMessage({ type: 'DONE', payload: { totalLength: 50, durationMs: 200, requestId: 'req-2' } })
      await nextTick()

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: '回答生成完成' }))
    })
  })

  describe('handleWorkerMessage - ERROR', () => {
    it('ERROR 消息设置 error 和 isStreaming=false', async () => {
      const { composable, worker } = await setupWorkerStream()

      worker.triggerMessage({ type: 'ERROR', payload: { error: '服务器错误' } })
      await nextTick()

      expect(composable.error.value).toBe('服务器错误')
      expect(composable.isStreaming.value).toBe(false)
      expect(composable.workerStatus.value).toBe('error')
    })

    it('ERROR 消息调用 toast 显示错误', async () => {
      const { worker } = await setupWorkerStream()

      mockToast.mockClear()
      worker.triggerMessage({ type: 'ERROR', payload: { error: '连接失败' } })
      await nextTick()

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: '生成失败',
        variant: 'destructive',
      }))
    })
  })

  describe('handleWorkerMessage - RECONNECTING', () => {
    it('RECONNECTING 消息设置 workerStatus=reconnecting', async () => {
      const { composable, worker } = await setupWorkerStream()

      worker.triggerMessage({ type: 'RECONNECTING', payload: { reconnectCount: 1 } })
      await nextTick()

      expect(composable.workerStatus.value).toBe('reconnecting')
    })
  })

  describe('handleWorkerMessage - TIMEOUT', () => {
    it('TIMEOUT 消息设置 error 和 workerStatus=error', async () => {
      const { composable, worker } = await setupWorkerStream()

      worker.triggerMessage({ type: 'TIMEOUT', payload: { error: '响应超时' } })
      await nextTick()

      expect(composable.error.value).toBe('响应超时')
      expect(composable.workerStatus.value).toBe('error')
    })
  })

  describe('handleWorkerMessage - RATE_LIMIT', () => {
    it('RATE_LIMIT 消息设置 error 和 isStreaming=false', async () => {
      const { composable, worker } = await setupWorkerStream()

      worker.triggerMessage({ type: 'RATE_LIMIT', payload: { error: '请求频率过高' } })
      await nextTick()

      expect(composable.error.value).toBe('请求频率过高')
      expect(composable.isStreaming.value).toBe(false)
    })
  })

  // ============ 7. subscribe / notifySubscribers ============

  describe('subscribe / notifySubscribers', () => {
    it('subscribe 立即调用回调一次（初始状态）', async () => {
      const { useChatStream } = await getModule()
      const { subscribe } = useChatStream()
      const callback = vi.fn()
      subscribe(callback)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('状态变化时通知订阅者', async () => {
      const { useChatStream } = await getModule()
      const { subscribe, streamedContent } = useChatStream()
      const callback = vi.fn()
      subscribe(callback)
      callback.mockClear()

      streamedContent.value = '新内容'
      await nextTick()

      expect(callback).toHaveBeenCalled()
    })

    it('取消订阅后不再收到通知', async () => {
      const { useChatStream } = await getModule()
      const { subscribe, streamedContent } = useChatStream()
      const callback = vi.fn()
      const unsubscribe = subscribe(callback)
      callback.mockClear()

      unsubscribe()
      streamedContent.value = '新内容'
      await nextTick()

      expect(callback).not.toHaveBeenCalled()
    })

    it('subscribe 回调接收到正确的 StreamState 结构', async () => {
      const { useChatStream } = await getModule()
      const { subscribe } = useChatStream()
      let receivedState: any = null
      subscribe((state) => { receivedState = state })

      expect(receivedState).toMatchObject({
        isStreaming: false,
        streamedContent: '',
        error: null,
        workerStatus: 'idle',
      })
    })
  })

  // ============ 8. cleanup ============

  describe('cleanup', () => {
    it('cleanup 后 isStreaming=false 且 currentSessionId=null', async () => {
      const { useChatStream } = await getModule()
      const { cleanup, isStreaming, currentSessionId } = useChatStream()
      isStreaming.value = true
      currentSessionId.value = 'session-123'

      cleanup()

      expect(isStreaming.value).toBe(false)
      expect(currentSessionId.value).toBeNull()
    })

    it('cleanup 后 streamedContent 被清空', async () => {
      const { useChatStream } = await getModule()
      const { cleanup, streamedContent } = useChatStream()
      streamedContent.value = '一些内容'
      cleanup()
      expect(streamedContent.value).toBe('')
    })

    it('cleanup 后 error 被清空', async () => {
      const { useChatStream } = await getModule()
      const { cleanup, error } = useChatStream()
      error.value = '某个错误'
      cleanup()
      expect(error.value).toBeNull()
    })
  })

  // ============ 9. renderedContent 计算属性 ============

  describe('renderedContent', () => {
    it('streamedContent 为空时返回空字符串', async () => {
      const { useChatStream } = await getModule()
      const { renderedContent } = useChatStream()
      expect(renderedContent.value).toBe('')
    })

    it('streamedContent 有内容时调用 marked.parse', async () => {
      const { useChatStream } = await getModule()
      const { renderedContent, streamedContent } = useChatStream()
      streamedContent.value = '# 标题'
      await nextTick()
      expect(renderedContent.value).toBe('<p># 标题</p>')
    })
  })

  // ============ 10. hasError / isDone 计算属性 ============

  describe('hasError', () => {
    it('error 为 null 时 hasError 为 false', async () => {
      const { useChatStream } = await getModule()
      const { hasError } = useChatStream()
      expect(hasError.value).toBe(false)
    })

    it('error 有值时 hasError 为 true', async () => {
      const { useChatStream } = await getModule()
      const { hasError, error } = useChatStream()
      error.value = '出错了'
      await nextTick()
      expect(hasError.value).toBe(true)
    })
  })

  describe('isDone', () => {
    it('未流式且有内容时 isDone 为 true', async () => {
      const { useChatStream } = await getModule()
      const { isDone, isStreaming, streamedContent } = useChatStream()
      isStreaming.value = false
      streamedContent.value = '回答内容'
      await nextTick()
      expect(isDone.value).toBe(true)
    })

    it('正在流式时 isDone 为 false', async () => {
      const { useChatStream } = await getModule()
      const { isDone, isStreaming, streamedContent } = useChatStream()
      isStreaming.value = true
      streamedContent.value = '部分内容'
      await nextTick()
      expect(isDone.value).toBe(false)
    })

    it('无内容时 isDone 为 false', async () => {
      const { useChatStream } = await getModule()
      const { isDone } = useChatStream()
      expect(isDone.value).toBe(false)
    })
  })

  // ============ 11. sendStreamMessage 兼容旧 API ============

  describe('sendStreamMessage 兼容旧 API', () => {
    it('sendStreamMessage 调用后 Worker 收到 postMessage', async () => {
      const { useChatStream } = await getModule()
      const { sendStreamMessage } = useChatStream()

      await sendStreamMessage({ userId: '1', query: '测试兼容' })
      await nextTick()

      expect(mockWorkerInstance).toBeDefined()
      expect(mockWorkerInstance!.postMessage).toHaveBeenCalled()
    })
  })
})
