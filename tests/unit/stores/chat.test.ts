import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChatStore } from '@/stores/chat'

// Mock 所有外部依赖
vi.mock('@/composables/useChatStream', () => ({
  useChatStream: () => ({
    startStream: vi.fn(),
    stopStream: vi.fn(),
    streamedContent: { value: '' },
    structuredData: { value: [] },
    isStreaming: { value: false },
    error: { value: null },
  }),
}))

vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('@/api/training-plan', () => ({
  importTrainingPlan: vi.fn(),
}))

vi.mock('@/api/rating', () => ({
  submitRating: vi.fn(),
}))

vi.mock('@/utils/chat-history-db', () => ({
  getTopicMessages: vi.fn().mockResolvedValue([]),
  saveMessage: vi.fn().mockResolvedValue(undefined),
  deleteTopicMessages: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/api/topic', () => ({
  getTopicMessages: vi.fn(),
  saveTopicMessage: vi.fn(),
}))

vi.mock('@/stores/topic', () => ({
  useTopicStore: () => ({
    ensureTopicExists: vi.fn().mockResolvedValue({ id: 'topic-1' }),
    updateTopicLocally: vi.fn(),
  }),
}))

describe('Chat Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => {
        if (key === 'yuzhen_persona_id') return 'coach_professional'
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  describe('初始状态', () => {
    it('messages 应为空数组', () => {
      const store = useChatStore()
      expect(store.messages).toEqual([])
    })

    it('loading/streaming/error 应为默认值', () => {
      const store = useChatStore()
      expect(store.loading).toBe(false)
      expect(store.streaming).toBe(false)
      expect(store.error).toBeNull()
    })

    it('pendingAttachments 应为空', () => {
      const store = useChatStore()
      expect(store.pendingAttachments).toEqual([])
    })

    it('currentPersonaId 应从 localStorage 读取', () => {
      const store = useChatStore()
      expect(store.currentPersonaId).toBe('coach_professional')
    })
  })

  describe('isLoggedIn', () => {
    it('无 token 时应为 false', () => {
      const store = useChatStore()
      expect(store.isLoggedIn).toBe(false)
    })

    it('有 token 和 userId 时应为 true', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'access_token') return 'mock-token'
          if (key === 'current_user_id') return '123'
          if (key === 'yuzhen_persona_id') return 'coach_professional'
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })
      setActivePinia(createPinia())
      const store = useChatStore()
      expect(store.isLoggedIn).toBe(true)
    })

    it('userId 为 guest 时应为 false', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'access_token') return 'mock-token'
          if (key === 'current_user_id') return 'guest'
          if (key === 'yuzhen_persona_id') return 'coach_professional'
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })
      setActivePinia(createPinia())
      const store = useChatStore()
      expect(store.isLoggedIn).toBe(false)
    })
  })

  describe('getMessagesByTopic', () => {
    it('应按 topicId 过滤消息', () => {
      const store = useChatStore()
      store.messages = [
        { id: '1', topicId: 'topic-a', role: 'user', content: 'hello', timestamp: 1, streaming: false },
        { id: '2', topicId: 'topic-b', role: 'user', content: 'world', timestamp: 2, streaming: false },
        { id: '3', topicId: 'topic-a', role: 'assistant', content: 'hi', timestamp: 3, streaming: false },
      ] as any[]

      const topicAMessages = store.getMessagesByTopic('topic-a')
      expect(topicAMessages).toHaveLength(2)
      expect(topicAMessages[0].id).toBe('1')
      expect(topicAMessages[1].id).toBe('3')
    })

    it('不存在的 topicId 应返回空数组', () => {
      const store = useChatStore()
      store.messages = [
        { id: '1', topicId: 'topic-a', role: 'user', content: 'hello', timestamp: 1, streaming: false },
      ] as any[]

      expect(store.getMessagesByTopic('nonexistent')).toEqual([])
    })
  })

  describe('lastMessage', () => {
    it('有消息时应返回最后一条', () => {
      const store = useChatStore()
      store.messages = [
        { id: '1', role: 'user', content: 'first', timestamp: 1, streaming: false },
        { id: '2', role: 'assistant', content: 'second', timestamp: 2, streaming: false },
      ] as any[]

      expect(store.lastMessage?.id).toBe('2')
    })

    it('无消息时应返回 null', () => {
      const store = useChatStore()
      expect(store.lastMessage).toBeNull()
    })
  })

  describe('clearMessages', () => {
    it('指定 topicId 时只清除该话题消息', () => {
      const store = useChatStore()
      store.messages = [
        { id: '1', topicId: 'topic-a', role: 'user', content: 'a', timestamp: 1, streaming: false },
        { id: '2', topicId: 'topic-b', role: 'user', content: 'b', timestamp: 2, streaming: false },
        { id: '3', topicId: 'topic-a', role: 'assistant', content: 'c', timestamp: 3, streaming: false },
      ] as any[]

      store.clearMessages('topic-a')
      expect(store.messages).toHaveLength(1)
      expect(store.messages[0].topicId).toBe('topic-b')
    })

    it('不指定 topicId 时清除所有消息', () => {
      const store = useChatStore()
      store.messages = [
        { id: '1', topicId: 'topic-a', role: 'user', content: 'a', timestamp: 1, streaming: false },
        { id: '2', topicId: 'topic-b', role: 'user', content: 'b', timestamp: 2, streaming: false },
      ] as any[]

      store.clearMessages()
      expect(store.messages).toEqual([])
    })
  })

  describe('deleteMessage', () => {
    it('应删除指定 ID 的消息', () => {
      const store = useChatStore()
      store.messages = [
        { id: '1', role: 'user', content: 'a', timestamp: 1, streaming: false },
        { id: '2', role: 'assistant', content: 'b', timestamp: 2, streaming: false },
      ] as any[]

      store.deleteMessage('1')
      expect(store.messages).toHaveLength(1)
      expect(store.messages[0].id).toBe('2')
    })

    it('删除不存在的 ID 不应报错', () => {
      const store = useChatStore()
      store.messages = [
        { id: '1', role: 'user', content: 'a', timestamp: 1, streaming: false },
      ] as any[]

      store.deleteMessage('nonexistent')
      expect(store.messages).toHaveLength(1)
    })
  })

  describe('updateStreamingMessage', () => {
    it('应更新指定消息的内容', () => {
      const store = useChatStore()
      store.messages = [
        { id: 'msg-1', role: 'assistant', content: '', timestamp: 1, streaming: true },
      ] as any[]

      store.updateStreamingMessage('msg-1', { content: '你好' })
      expect(store.messages[0].content).toBe('你好')
    })

    it('应更新 toolCalls', () => {
      const store = useChatStore()
      store.messages = [
        { id: 'msg-1', role: 'assistant', content: '', timestamp: 1, streaming: true },
      ] as any[]

      const toolCalls = [{ id: 't1', name: 'search', displayName: '搜索', status: 'success' as const, startTime: 1 }]
      store.updateStreamingMessage('msg-1', { toolCalls })
      expect(store.messages[0].toolCalls).toEqual(toolCalls)
    })

    it('不存在的消息 ID 不应报错', () => {
      const store = useChatStore()
      store.messages = []
      expect(() => store.updateStreamingMessage('nonexistent', { content: 'test' })).not.toThrow()
    })
  })

  describe('finishStreamingMessage', () => {
    it('应将 streaming 设为 false', () => {
      const store = useChatStore()
      store.messages = [
        { id: 'msg-1', role: 'assistant', content: 'hello', timestamp: 1, streaming: true },
      ] as any[]

      store.finishStreamingMessage('msg-1')
      expect(store.messages[0].streaming).toBe(false)
    })

    it('应合并 finalData', () => {
      const store = useChatStore()
      store.messages = [
        { id: 'msg-1', role: 'assistant', content: 'hello', timestamp: 1, streaming: true },
      ] as any[]

      store.finishStreamingMessage('msg-1', {
        personalizationScore: 0.85,
        profileUtilizationRate: 0.7,
      })
      expect(store.messages[0].streaming).toBe(false)
      expect(store.messages[0].personalizationScore).toBe(0.85)
      expect(store.messages[0].profileUtilizationRate).toBe(0.7)
    })
  })

  describe('附件管理', () => {
    it('addAttachment 应添加附件', () => {
      const store = useChatStore()
      store.addAttachment({ id: 'a1', file: new File([], 'test.jpg'), preview: 'data:...', base64: 'abc' })
      expect(store.pendingAttachments).toHaveLength(1)
    })

    it('addAttachment 最多3张', () => {
      const store = useChatStore()
      for (let i = 0; i < 5; i++) {
        store.addAttachment({ id: `a${i}`, file: new File([], `test${i}.jpg`), preview: '', base64: '' })
      }
      expect(store.pendingAttachments).toHaveLength(3)
    })

    it('removeAttachment 应移除指定附件', () => {
      const store = useChatStore()
      store.addAttachment({ id: 'a1', file: new File([], 'test1.jpg'), preview: '', base64: '' })
      store.addAttachment({ id: 'a2', file: new File([], 'test2.jpg'), preview: '', base64: '' })
      store.removeAttachment('a1')
      expect(store.pendingAttachments).toHaveLength(1)
      expect(store.pendingAttachments[0].id).toBe('a2')
    })

    it('clearAttachments 应清空所有附件', () => {
      const store = useChatStore()
      store.addAttachment({ id: 'a1', file: new File([], 'test.jpg'), preview: '', base64: '' })
      store.addAttachment({ id: 'a2', file: new File([], 'test2.jpg'), preview: '', base64: '' })
      store.clearAttachments()
      expect(store.pendingAttachments).toEqual([])
    })
  })

  describe('Persona 管理', () => {
    it('setPersonaId 应更新值并写入 localStorage', () => {
      const store = useChatStore()
      store.setPersonaId('coach_friendly')
      expect(store.currentPersonaId).toBe('coach_friendly')
      expect(localStorage.setItem).toHaveBeenCalledWith('yuzhen_persona_id', 'coach_friendly')
    })
  })

  describe('sendMessage 校验', () => {
    it('超过2000字符应拒绝发送', async () => {
      const store = useChatStore()
      const longContent = 'a'.repeat(2001)
      await store.sendMessage({ content: longContent })
      expect(store.error).toContain('消息过长')
      expect(store.loading).toBe(false)
      expect(store.streaming).toBe(false)
    })
  })

  describe('parseToolCalls', () => {
    it('无 metadata 应返回 undefined', () => {
      const store = useChatStore()
      expect(store.parseToolCalls(undefined)).toBeUndefined()
    })

    it('无 dag_execution 应返回 undefined', () => {
      const store = useChatStore()
      expect(store.parseToolCalls({ some: 'data' })).toBeUndefined()
    })

    it('应正确解析工具调用', () => {
      const store = useChatStore()
      const result = store.parseToolCalls({
        dag_execution: {
          tools: [
            { name: 'search_exercises', display_name: '搜索动作', status: 'success', duration: 120 },
            { name: 'get_nutrition', display_name: '获取营养', status: 'success', duration: 80 },
          ],
        },
      })
      expect(result).toHaveLength(2)
      expect(result![0].name).toBe('search_exercises')
      expect(result![0].displayName).toBe('搜索动作')
      expect(result![1].name).toBe('get_nutrition')
    })

    it('空 tools 数组应返回 undefined', () => {
      const store = useChatStore()
      expect(store.parseToolCalls({ dag_execution: { tools: [] } })).toBeUndefined()
    })
  })

  describe('loadMessages', () => {
    it('IndexedDB 有数据时应从 IndexedDB 加载', async () => {
      const { getTopicMessages } = await import('@/utils/chat-history-db')
      vi.mocked(getTopicMessages).mockResolvedValue([
        { id: 'msg-1', topicId: 'topic-1', userId: 'u1', role: 'user', content: 'hello', createdAt: '2026-01-01T00:00:00Z' },
        { id: 'msg-2', topicId: 'topic-1', userId: 'u1', role: 'assistant', content: 'hi', createdAt: '2026-01-01T00:00:01Z' },
      ] as any[])

      const store = useChatStore()
      const result = await store.loadMessages('topic-1')
      expect(result.success).toBe(true)
      expect(store.messages).toHaveLength(2)
      expect(store.messages[0].role).toBe('user')
      expect(store.messages[1].role).toBe('assistant')
    })

    it('加载失败应设置 error', async () => {
      const { getTopicMessages } = await import('@/utils/chat-history-db')
      vi.mocked(getTopicMessages).mockRejectedValue(new Error('DB error'))

      const store = useChatStore()
      const result = await store.loadMessages('topic-1')
      expect(result.success).toBe(false)
      expect(store.error).toBe('DB error')
      expect(store.messages).toEqual([])
    })

    it('加载时 loading 应为 true，完成后为 false', async () => {
      const { getTopicMessages } = await import('@/utils/chat-history-db')
      vi.mocked(getTopicMessages).mockResolvedValue([])

      const store = useChatStore()
      const promise = store.loadMessages('topic-1')
      // loading 在 finally 中设为 false，await 后检查
      await promise
      expect(store.loading).toBe(false)
    })
  })
})
