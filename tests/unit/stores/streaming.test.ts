import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStreamingStore } from '@/stores/streaming'

// Mock streaming-cache
vi.mock('@/utils/streaming-cache', () => ({
  checkAndMarkTimeoutSessions: vi.fn(),
  getActiveSession: vi.fn(),
}))

import * as streamCache from '@/utils/streaming-cache'

describe('Streaming Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('status 为 idle', () => {
      const store = useStreamingStore()
      expect(store.status).toBe('idle')
      expect(store.sessionId).toBeNull()
      expect(store.isStreaming).toBe(false)
      expect(store.hasActiveSession).toBe(false)
    })
  })

  describe('startStreaming', () => {
    it('正确设置流式状态', () => {
      const store = useStreamingStore()
      store.startStreaming({
        sessionId: 'sess-1',
        userId: 'user-1',
        query: '如何做深蹲',
      })

      expect(store.status).toBe('streaming')
      expect(store.sessionId).toBe('sess-1')
      expect(store.userId).toBe('user-1')
      expect(store.query).toBe('如何做深蹲')
      expect(store.isStreaming).toBe(true)
      expect(store.hasActiveSession).toBe(true)
      expect(store.startTime).toBeTypeOf('number')
      expect(store.hasNewContent).toBe(true)
      expect(store.errorMessage).toBeNull()
    })
  })

  describe('updateContentLength', () => {
    it('更新内容长度并标记新内容', () => {
      const store = useStreamingStore()
      store.updateContentLength(256)
      expect(store.contentLength).toBe(256)
      expect(store.hasNewContent).toBe(true)
    })
  })

  describe('markCompleted', () => {
    it('标记流式完成', () => {
      const store = useStreamingStore()
      store.startStreaming({ sessionId: 's1', userId: 'u1', query: 'q' })
      store.markCompleted()

      expect(store.status).toBe('completed')
      expect(store.hasNewContent).toBe(true)
      expect(store.hasActiveSession).toBe(true) // completed + hasNewContent = active
    })
  })

  describe('markError', () => {
    it('标记流式错误', () => {
      const store = useStreamingStore()
      store.startStreaming({ sessionId: 's1', userId: 'u1', query: 'q' })
      store.markError('连接超时')

      expect(store.status).toBe('error')
      expect(store.errorMessage).toBe('连接超时')
      expect(store.isStreaming).toBe(false)
    })
  })

  describe('markContentViewed', () => {
    it('标记内容已查看', () => {
      const store = useStreamingStore()
      store.startStreaming({ sessionId: 's1', userId: 'u1', query: 'q' })
      store.markCompleted()
      expect(store.hasNewContent).toBe(true)

      store.markContentViewed()
      expect(store.hasNewContent).toBe(false)
      expect(store.hasActiveSession).toBe(false) // completed + !hasNewContent = inactive
    })
  })

  describe('shouldShowIndicator', () => {
    it('不在聊天页面且有活跃会话时显示', () => {
      const store = useStreamingStore()
      store.startStreaming({ sessionId: 's1', userId: 'u1', query: 'q' })
      store.setOnChatPage(false)

      expect(store.shouldShowIndicator).toBe(true)
    })

    it('在聊天页面时不显示', () => {
      const store = useStreamingStore()
      store.startStreaming({ sessionId: 's1', userId: 'u1', query: 'q' })
      store.setOnChatPage(true)

      expect(store.shouldShowIndicator).toBe(false)
    })

    it('无活跃会话时不显示', () => {
      const store = useStreamingStore()
      store.setOnChatPage(false)

      expect(store.shouldShowIndicator).toBe(false)
    })
  })

  describe('setOnChatPage', () => {
    it('进入聊天页面自动标记内容已查看', () => {
      const store = useStreamingStore()
      store.startStreaming({ sessionId: 's1', userId: 'u1', query: 'q' })
      expect(store.hasNewContent).toBe(true)

      store.setOnChatPage(true)
      expect(store.hasNewContent).toBe(false)
    })
  })

  describe('reset', () => {
    it('重置所有状态', () => {
      const store = useStreamingStore()
      store.startStreaming({ sessionId: 's1', userId: 'u1', query: 'q' })
      store.updateContentLength(100)

      store.reset()

      expect(store.status).toBe('idle')
      expect(store.sessionId).toBeNull()
      expect(store.userId).toBeNull()
      expect(store.query).toBeNull()
      expect(store.contentLength).toBe(0)
      expect(store.startTime).toBeNull()
      expect(store.hasNewContent).toBe(false)
      expect(store.errorMessage).toBeNull()
    })
  })

  describe('state computed', () => {
    it('返回完整状态快照', () => {
      const store = useStreamingStore()
      store.startStreaming({ sessionId: 's1', userId: 'u1', query: 'q' })

      const snapshot = store.state
      expect(snapshot.status).toBe('streaming')
      expect(snapshot.sessionId).toBe('s1')
      expect(snapshot.userId).toBe('u1')
      expect(snapshot.query).toBe('q')
    })
  })

  describe('restoreFromCache', () => {
    it('恢复活跃的 streaming 会话', async () => {
      vi.mocked(streamCache.getActiveSession).mockResolvedValue({
        sessionId: 'cached-1',
        userId: 'u1',
        query: '恢复的查询',
        content: 'some content',
        createdAt: Date.now() - 5000,
        status: 'streaming',
      } as any)

      const store = useStreamingStore()
      const restored = await store.restoreFromCache('u1')

      expect(restored).toBe(true)
      expect(store.sessionId).toBe('cached-1')
      expect(store.status).toBe('streaming')
      expect(store.hasNewContent).toBe(true)
    })

    it('恢复 completed 会话', async () => {
      vi.mocked(streamCache.getActiveSession).mockResolvedValue({
        sessionId: 'cached-2',
        userId: 'u1',
        query: 'q',
        content: 'done',
        createdAt: Date.now(),
        status: 'completed',
      } as any)

      const store = useStreamingStore()
      const restored = await store.restoreFromCache('u1')

      expect(restored).toBe(true)
      expect(store.status).toBe('completed')
    })

    it('恢复 error 会话', async () => {
      vi.mocked(streamCache.getActiveSession).mockResolvedValue({
        sessionId: 'cached-3',
        userId: 'u1',
        query: 'q',
        content: '',
        createdAt: Date.now(),
        status: 'error',
        errorMessage: '超时',
      } as any)

      const store = useStreamingStore()
      const restored = await store.restoreFromCache('u1')

      expect(restored).toBe(true)
      expect(store.status).toBe('error')
      expect(store.errorMessage).toBe('超时')
    })

    it('无活跃会话返回 false', async () => {
      vi.mocked(streamCache.getActiveSession).mockResolvedValue(null)

      const store = useStreamingStore()
      const restored = await store.restoreFromCache('u1')

      expect(restored).toBe(false)
    })

    it('缓存读取失败返回 false', async () => {
      vi.mocked(streamCache.getActiveSession).mockRejectedValue(new Error('DB error'))

      const store = useStreamingStore()
      const restored = await store.restoreFromCache('u1')

      expect(restored).toBe(false)
    })
  })
})
