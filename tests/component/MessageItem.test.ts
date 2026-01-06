/**
 * MessageItem组件测试
 * 
 * 测试消息项的渲染、交互和状态显示
 * 
 * @module tests/component/MessageItem
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import MessageItem from '@/components/chat/MessageItem.vue'

// Mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div>Home</div>' } }]
})

// Mock toast
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('MessageItem Component', () => {
  const createWrapper = (message: any, options = {}) => {
    return mount(MessageItem, {
      props: { message },
      global: {
        plugins: [router],
        stubs: {
          ToolCallDialog: true,
          RatingDialog: true,
          TrainingPlanCard: true
        }
      },
      ...options
    })
  }

  describe('用户消息渲染', () => {
    it('应该正确渲染用户消息', () => {
      const message = {
        id: '1',
        topicId: 'topic-1',
        role: 'user' as const,
        content: '你好，帮我制定一个训练计划',
        timestamp: Date.now()
      }

      const wrapper = createWrapper(message)
      
      expect(wrapper.text()).toContain('你好，帮我制定一个训练计划')
      expect(wrapper.find('.message-user').exists()).toBe(true)
    })

    it('应该显示用户头像', () => {
      const message = {
        id: '1',
        topicId: 'topic-1',
        role: 'user' as const,
        content: '测试消息',
        timestamp: Date.now()
      }

      const wrapper = createWrapper(message)
      
      // 用户消息应该有头像
      expect(wrapper.findComponent({ name: 'Avatar' }).exists()).toBe(true)
    })
  })

  describe('AI消息渲染', () => {
    it('应该正确渲染AI消息', () => {
      const message = {
        id: '2',
        topicId: 'topic-1',
        role: 'assistant' as const,
        content: '好的，我来帮您制定训练计划。',
        timestamp: Date.now()
      }

      const wrapper = createWrapper(message)
      
      expect(wrapper.text()).toContain('好的，我来帮您制定训练计划')
      expect(wrapper.find('.message-assistant').exists()).toBe(true)
    })

    it('应该显示流式打字指示器', () => {
      const message = {
        id: '2',
        topicId: 'topic-1',
        role: 'assistant' as const,
        content: '正在生成...',
        timestamp: Date.now(),
        streaming: true
      }

      const wrapper = createWrapper(message)
      
      // 流式状态应该显示打字指示器
      expect(wrapper.findAll('.animate-bounce').length).toBe(3)
    })

    it('应该在非流式状态下显示评分按钮', () => {
      const message = {
        id: '2',
        topicId: 'topic-1',
        role: 'assistant' as const,
        content: '这是AI回复',
        timestamp: Date.now(),
        streaming: false
      }

      const wrapper = createWrapper(message)
      
      expect(wrapper.text()).toContain('评分')
    })

    it('应该显示已评分状态', () => {
      const message = {
        id: '2',
        topicId: 'topic-1',
        role: 'assistant' as const,
        content: '这是AI回复',
        timestamp: Date.now(),
        rating: { overall: 5 }
      }

      const wrapper = createWrapper(message)
      
      expect(wrapper.text()).toContain('已评分')
    })
  })

  describe('系统消息渲染', () => {
    it('应该正确渲染系统消息', () => {
      const message = {
        id: '3',
        topicId: 'topic-1',
        role: 'system' as const,
        content: '欢迎使用智能健身顾问',
        timestamp: Date.now()
      }

      const wrapper = createWrapper(message)
      
      expect(wrapper.text()).toContain('欢迎使用智能健身顾问')
      expect(wrapper.find('.message-system').exists()).toBe(true)
    })
  })

  describe('工具调用显示', () => {
    it('应该显示工具调用按钮', () => {
      const message = {
        id: '2',
        topicId: 'topic-1',
        role: 'assistant' as const,
        content: '已为您分析',
        timestamp: Date.now(),
        toolCalls: [
          { id: '1', name: 'exercise_selector', displayName: '动作选择', status: 'success' as const, startTime: Date.now() }
        ]
      }

      const wrapper = createWrapper(message)
      
      expect(wrapper.text()).toContain('专业工具')
      expect(wrapper.text()).toContain('1/1')
    })

    it('应该显示正确的工具调用统计', () => {
      const message = {
        id: '2',
        topicId: 'topic-1',
        role: 'assistant' as const,
        content: '已为您分析',
        timestamp: Date.now(),
        toolCalls: [
          { id: '1', name: 'tool1', displayName: '工具1', status: 'success' as const, startTime: Date.now() },
          { id: '2', name: 'tool2', displayName: '工具2', status: 'error' as const, startTime: Date.now() },
          { id: '3', name: 'tool3', displayName: '工具3', status: 'success' as const, startTime: Date.now() }
        ]
      }

      const wrapper = createWrapper(message)
      
      // 2个成功，共3个
      expect(wrapper.text()).toContain('2/3')
    })
  })

  describe('个性化指标显示', () => {
    it('应该显示个性化程度', () => {
      const message = {
        id: '2',
        topicId: 'topic-1',
        role: 'assistant' as const,
        content: '个性化回复',
        timestamp: Date.now(),
        personalizationScore: 0.85
      }

      const wrapper = createWrapper(message)
      
      expect(wrapper.text()).toContain('个性化程度: 85%')
    })

    it('应该显示档案利用率', () => {
      const message = {
        id: '2',
        topicId: 'topic-1',
        role: 'assistant' as const,
        content: '个性化回复',
        timestamp: Date.now(),
        personalizationScore: 0.85,
        profileUtilizationRate: 0.72
      }

      const wrapper = createWrapper(message)
      
      expect(wrapper.text()).toContain('档案利用率: 72%')
    })
  })

  describe('时间格式化', () => {
    it('应该显示"刚刚" - 小于1分钟', () => {
      const message = {
        id: '1',
        topicId: 'topic-1',
        role: 'user' as const,
        content: '测试',
        timestamp: Date.now() - 30000 // 30秒前
      }

      const wrapper = createWrapper(message)
      
      expect(wrapper.text()).toContain('刚刚')
    })

    it('应该显示"X分钟前" - 小于1小时', () => {
      const message = {
        id: '1',
        topicId: 'topic-1',
        role: 'user' as const,
        content: '测试',
        timestamp: Date.now() - 600000 // 10分钟前
      }

      const wrapper = createWrapper(message)
      
      expect(wrapper.text()).toContain('分钟前')
    })
  })

  describe('Markdown渲染', () => {
    it('应该正确渲染Markdown内容', () => {
      const message = {
        id: '2',
        topicId: 'topic-1',
        role: 'assistant' as const,
        content: '**粗体文本** 和 *斜体文本*',
        timestamp: Date.now()
      }

      const wrapper = createWrapper(message)
      
      // 检查HTML是否被渲染
      expect(wrapper.find('.prose').exists()).toBe(true)
    })
  })
})
