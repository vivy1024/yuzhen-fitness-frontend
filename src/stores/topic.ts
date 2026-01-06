/**
 * 话题状态管理
 * 登录用户：使用后端API持久化
 * 游客用户：使用IndexedDB本地存储
 * 
 * @author 玉珍健身 v3.0
 * @updated 2026-01-02 - 集成后端API + IndexedDB混合模式
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as chatHistoryDB from '@/utils/chat-history-db'
import * as topicApi from '@/api/topic'
import type { ChatTopic } from '@/utils/chat-history-db'

// 前端Topic格式
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

export const useTopicStore = defineStore('topic', () => {
  // State
  const topics = ref<Topic[]>([])
  const currentTopicId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  // Getters
  const currentTopic = computed(() => {
    if (!currentTopicId.value) return null
    return topics.value.find(t => t.id === currentTopicId.value) || null
  })

  const sortedTopics = computed(() => {
    return [...topics.value].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  })

  /**
   * 检查用户是否已登录
   */
  const isLoggedIn = computed(() => {
    const token = localStorage.getItem('access_token')
    const userId = localStorage.getItem('current_user_id') || localStorage.getItem('user_id')
    return !!token && !!userId && userId !== 'guest'
  })

  // Actions

  /**
   * 获取当前用户ID
   */
  function getCurrentUserId(): string {
    return localStorage.getItem('current_user_id') || 
           localStorage.getItem('user_id') || 
           'guest'
  }

  /**
   * 初始化话题列表
   */
  async function init() {
    if (initialized.value) return
    
    const savedTopicId = localStorage.getItem('current_topic_id')
    if (savedTopicId) {
      currentTopicId.value = savedTopicId
    }
    
    // 加载话题
    await fetchTopics()
    initialized.value = true
  }

  /**
   * 获取话题列表
   * 登录用户从后端获取，游客从IndexedDB获取
   */
  async function fetchTopics() {
    try {
      loading.value = true
      error.value = null
      
      if (isLoggedIn.value) {
        // 登录用户：从后端API获取
        const response = await topicApi.getTopics()
        if (response.code === 200 && response.data) {
          topics.value = response.data.map(t => ({
            id: t.id,
            name: t.name,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            messageCount: t.messageCount,
            lastMessage: t.lastMessage
          }))
        }
      } else {
        // 游客：从IndexedDB获取
        const userId = getCurrentUserId()
        const dbTopics = await chatHistoryDB.getUserTopics(userId)
        
        topics.value = dbTopics.map(t => ({
          id: t.id,
          name: t.name,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          messageCount: t.messageCount,
          lastMessage: t.lastMessagePreview
        }))
      }
      
      // 如果当前话题不存在于列表中，清除当前话题
      if (currentTopicId.value && !topics.value.find(t => t.id === currentTopicId.value)) {
        if (!currentTopicId.value.startsWith('local_') && !currentTopicId.value.startsWith('topic_')) {
          currentTopicId.value = null
          localStorage.removeItem('current_topic_id')
        }
      }
      
      return { success: true }
    } catch (err: any) {
      console.error('获取话题列表失败:', err)
      error.value = err.message || '获取话题列表失败'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建新话题
   */
  async function createNewTopic(data: CreateTopicData) {
    try {
      loading.value = true
      error.value = null
      
      let newTopic: Topic
      
      if (isLoggedIn.value) {
        // 登录用户：调用后端API
        const response = await topicApi.createTopic(data)
        if (response.code !== 200 || !response.data) {
          throw new Error(response.msg || '创建话题失败')
        }
        newTopic = {
          id: response.data.id,
          name: response.data.name,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt,
          messageCount: response.data.messageCount || 0,
          lastMessage: response.data.lastMessage
        }
      } else {
        // 游客：保存到IndexedDB
        const userId = getCurrentUserId()
        const dbTopic = await chatHistoryDB.createTopic(userId, data.name)
        newTopic = {
          id: dbTopic.id,
          name: dbTopic.name,
          createdAt: dbTopic.createdAt,
          updatedAt: dbTopic.updatedAt,
          messageCount: dbTopic.messageCount,
          lastMessage: dbTopic.lastMessagePreview
        }
      }
      
      topics.value.unshift(newTopic)
      
      // 自动切换到新话题
      setCurrentTopic(newTopic.id)
      
      return { success: true, data: newTopic }
    } catch (err: any) {
      console.error('创建话题失败:', err)
      error.value = err.message || '创建话题失败'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除话题
   */
  async function removeTopic(topicId: string) {
    try {
      loading.value = true
      error.value = null
      
      if (isLoggedIn.value) {
        // 登录用户：调用后端API
        const response = await topicApi.deleteTopic(topicId)
        if (response.code !== 200) {
          throw new Error(response.msg || '删除话题失败')
        }
      } else {
        // 游客：从IndexedDB删除
        await chatHistoryDB.deleteTopic(topicId)
      }
      
      // 从列表中移除
      topics.value = topics.value.filter(t => t.id !== topicId)
      
      // 如果删除的是当前话题，清除当前话题
      if (currentTopicId.value === topicId) {
        currentTopicId.value = null
        localStorage.removeItem('current_topic_id')
      }
      
      return { success: true }
    } catch (err: any) {
      console.error('删除话题失败:', err)
      error.value = err.message || '删除话题失败'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * 设置当前话题
   */
  function setCurrentTopic(topicId: string | null) {
    currentTopicId.value = topicId
    if (topicId) {
      localStorage.setItem('current_topic_id', topicId)
      
      // 如果话题不在列表中，添加一个临时话题
      if (!topics.value.find(t => t.id === topicId)) {
        const now = new Date().toISOString()
        topics.value.unshift({
          id: topicId,
          name: '新对话',
          createdAt: now,
          updatedAt: now,
          messageCount: 0
        })
      }
    } else {
      localStorage.removeItem('current_topic_id')
    }
  }

  /**
   * 更新话题信息
   */
  async function updateTopicLocally(topicId: string, updates: Partial<Topic>) {
    const index = topics.value.findIndex(t => t.id === topicId)
    if (index === -1) return
    
    const now = new Date().toISOString()
    topics.value[index] = {
      ...topics.value[index],
      ...updates,
      updatedAt: now
    }
    
    // 同步到后端或IndexedDB
    try {
      if (isLoggedIn.value) {
        // 登录用户：调用后端API更新
        await topicApi.updateTopic(topicId, {
          name: updates.name
        })
      } else {
        // 游客：更新IndexedDB
        await chatHistoryDB.updateTopic(topicId, {
          name: updates.name,
          messageCount: updates.messageCount,
          lastMessagePreview: updates.lastMessage
        })
      }
    } catch (err) {
      console.warn('更新话题失败:', err)
    }
  }

  /**
   * 增加话题消息计数
   */
  function incrementMessageCount(topicId: string) {
    const topic = topics.value.find(t => t.id === topicId)
    if (topic) {
      topic.messageCount++
      topic.updatedAt = new Date().toISOString()
    }
  }

  /**
   * 确保话题存在（如果不存在则创建）
   */
  async function ensureTopicExists(topicId: string, name?: string): Promise<Topic> {
    let topic = topics.value.find(t => t.id === topicId)
    
    if (topic) return topic
    
    if (isLoggedIn.value) {
      // 登录用户：尝试从后端获取或创建
      try {
        const response = await topicApi.getTopicDetail(topicId)
        if (response.code === 200 && response.data) {
          topic = {
            id: response.data.id,
            name: response.data.name,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
            messageCount: response.data.messageCount,
            lastMessage: response.data.lastMessage
          }
          topics.value.unshift(topic)
          return topic
        }
      } catch (err) {
        // 话题不存在，创建新话题
      }
      
      // 创建新话题
      const createResult = await createNewTopic({ name: name || '新对话' })
      if (createResult.success && createResult.data) {
        return createResult.data
      }
    } else {
      // 游客：检查IndexedDB
      const dbTopic = await chatHistoryDB.getTopic(topicId)
      
      if (dbTopic) {
        topic = {
          id: dbTopic.id,
          name: dbTopic.name,
          createdAt: dbTopic.createdAt,
          updatedAt: dbTopic.updatedAt,
          messageCount: dbTopic.messageCount,
          lastMessage: dbTopic.lastMessagePreview
        }
        topics.value.unshift(topic)
        return topic
      }
      
      // 创建新话题
      const userId = getCurrentUserId()
      const newDbTopic = await chatHistoryDB.createTopic(userId, name || '新对话')
      
      topic = {
        id: newDbTopic.id,
        name: newDbTopic.name,
        createdAt: newDbTopic.createdAt,
        updatedAt: newDbTopic.updatedAt,
        messageCount: newDbTopic.messageCount,
        lastMessage: newDbTopic.lastMessagePreview
      }
      topics.value.unshift(topic)
      return topic
    }
    
    // 兜底：创建本地临时话题
    const now = new Date().toISOString()
    topic = {
      id: topicId,
      name: name || '新对话',
      createdAt: now,
      updatedAt: now,
      messageCount: 0
    }
    topics.value.unshift(topic)
    return topic
  }

  /**
   * 清空所有话题（用于登出等场景）
   */
  function clearTopics() {
    topics.value = []
    currentTopicId.value = null
    localStorage.removeItem('current_topic_id')
    initialized.value = false
  }

  /**
   * 重新初始化（用于登录/登出后刷新数据）
   */
  async function reinit() {
    initialized.value = false
    topics.value = []
    await init()
  }

  return {
    // State
    topics,
    currentTopicId,
    loading,
    error,
    
    // Getters
    currentTopic,
    sortedTopics,
    isLoggedIn,
    
    // Actions
    init,
    fetchTopics,
    createNewTopic,
    removeTopic,
    setCurrentTopic,
    updateTopicLocally,
    incrementMessageCount,
    ensureTopicExists,
    clearTopics,
    reinit,
  }
})
