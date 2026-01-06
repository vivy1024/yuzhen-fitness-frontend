/**
 * AI聊天状态管理
 * 管理消息列表、工具调用、流式响应等
 * 登录用户：使用后端API持久化
 * 游客用户：使用IndexedDB本地存储
 * 
 * @author 玉珍健身 v3.0
 * @updated 2026-01-02 - 集成后端API + IndexedDB混合模式
 * @spec yuzhen-fitness-feature-migration - TASK-4.2
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '@/components/chat/MessageItem.vue'
import type { ToolCall } from '@/components/chat/ToolCallTimeline.vue'
import type { TrainingPlan } from '@/components/training/TrainingPlanCard.vue'
import type { Rating } from '@/components/chat/RatingDialog.vue'
import { useChatStream } from '@/composables/useChatStream'
import { useToast } from '@/components/ui/toast'
import { importTrainingPlan as importPlanAPI } from '@/api/training-plan'
import { submitRating as submitRatingAPI } from '@/api/rating'
import * as chatHistoryDB from '@/utils/chat-history-db'
import * as topicApi from '@/api/topic'
import { useTopicStore } from '@/stores/topic'

/**
 * 消息发送数据
 */
export interface SendMessageData {
  content: string
  topicId?: string
}

/**
 * AI响应数据（从后端返回）
 */
export interface AIResponse {
  content: string
  toolCalls?: ToolCall[]
  trainingPlan?: any
  personalizationScore?: number
  profileUtilizationRate?: number
  metadata?: Record<string, any>
}

export const useChatStore = defineStore('chat', () => {
  const { toast } = useToast()
  
  // State
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const streaming = ref(false)
  const error = ref<string | null>(null)
  
  // 流式响应composable
  const chatStream = useChatStream()
  
  // 当前流式消息ID
  let currentStreamingMessageId: string | null = null

  // Getters
  
  /**
   * 检查用户是否已登录
   */
  const isLoggedIn = computed(() => {
    const token = localStorage.getItem('access_token')
    const userId = localStorage.getItem('current_user_id') || localStorage.getItem('user_id')
    return !!token && !!userId && userId !== 'guest'
  })
  
  /**
   * 获取指定话题的消息列表
   */
  const getMessagesByTopic = computed(() => {
    return (topicId: string) => {
      return messages.value.filter(m => m.topicId === topicId)
    }
  })

  /**
   * 获取最后一条消息
   */
  const lastMessage = computed(() => {
    return messages.value[messages.value.length - 1] || null
  })

  // Actions

  /**
   * 加载指定话题的消息历史
   * 优先从IndexedDB获取（本地缓存），后端API作为备选
   */
  async function loadMessages(topicId: string) {
    try {
      loading.value = true
      error.value = null
      
      // 优先从IndexedDB获取（本地缓存，确保刷新后消息不丢失）
      const dbMessages = await chatHistoryDB.getTopicMessages(topicId)
      
      if (dbMessages.length > 0) {
        messages.value = dbMessages.map(msg => ({
          id: msg.id,
          topicId: msg.topicId,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: typeof msg.createdAt === 'string' ? new Date(msg.createdAt).getTime() : msg.createdAt,
          streaming: false,
          metadata: msg.metadata
        }))
        console.log('[ChatStore] 从IndexedDB加载了', dbMessages.length, '条消息')
        return { success: true }
      }
      
      // IndexedDB为空时，尝试从后端API获取（登录用户）
      if (isLoggedIn.value) {
        try {
          const response = await topicApi.getTopicMessages(topicId)
          if (response.code === 200 && response.data && response.data.length > 0) {
            messages.value = response.data.map(msg => ({
              id: msg.id,
              topicId: msg.topicId,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              timestamp: msg.timestamp,
              streaming: false,
              toolCalls: msg.toolCalls,
              trainingPlan: msg.trainingPlan
            }))
            console.log('[ChatStore] 从后端API加载了', response.data.length, '条消息')
            return { success: true }
          }
        } catch (apiErr) {
          console.warn('[ChatStore] 从后端加载消息失败:', apiErr)
        }
      }
      
      // 没有消息
      messages.value = []
      return { success: true }
    } catch (err: any) {
      console.error('加载消息失败:', err)
      error.value = err.message || '加载消息失败'
      messages.value = []
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  /**
   * 发送消息（使用真实流式响应 + 持久化）
   */
  async function sendMessage(data: SendMessageData) {
    try {
      loading.value = true
      streaming.value = true
      error.value = null
      
      // 获取用户ID
      const userId = localStorage.getItem('current_user_id') || 
                     localStorage.getItem('user_id') || 
                     `guest_${Date.now()}`
      
      // 确保话题存在
      const topicStore = useTopicStore()
      const topicId = data.topicId || 'default'
      const topic = await topicStore.ensureTopicExists(topicId, data.content.slice(0, 20))
      
      // 使用后端返回的话题ID（登录用户）
      const actualTopicId = topic.id
      
      // 创建用户消息
      const userMessage: Message = {
        id: generateMessageId(),
        topicId: actualTopicId,
        role: 'user',
        content: data.content,
        timestamp: Date.now()
      }
      
      // 添加到消息列表
      messages.value.push(userMessage)
      
      // 保存用户消息到IndexedDB（登录用户和游客都保存，确保刷新后不丢失）
      await chatHistoryDB.saveMessage({
        id: userMessage.id,
        topicId: actualTopicId,
        userId,
        role: 'user',
        content: data.content,
        timestamp: new Date().toISOString()
      })
      
      // 登录用户同时保存到后端
      if (isLoggedIn.value) {
        try {
          await topicApi.saveTopicMessage(actualTopicId, {
            role: 'user',
            content: data.content,
            client_id: userMessage.id
          })
        } catch (err) {
          console.warn('[ChatStore] 保存用户消息到后端失败:', err)
        }
      }
      
      // 创建AI消息占位符（用于流式响应）
      const aiMessage: Message = {
        id: generateMessageId(),
        topicId: actualTopicId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        streaming: true
      }
      
      messages.value.push(aiMessage)
      currentStreamingMessageId = aiMessage.id
      
      // 订阅流式状态更新
      const unsubscribe = chatStream.subscribe((state) => {
        if (currentStreamingMessageId) {
          updateStreamingMessage(currentStreamingMessageId, {
            content: state.streamedContent
          })
        }
      })
      
      console.log('[ChatStore] 发送消息，用户ID:', userId, '话题ID:', actualTopicId)
      
      // 启动流式响应（传递topicId用于多轮对话）
      await chatStream.startStream({
        userId,
        query: data.content,
        sessionId: chatStream.currentSessionId.value || undefined,
        topicId: actualTopicId,  // 传递话题ID用于多轮对话上下文
        domain: 'fitness'
      })
      
      // 等待流式完成
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          if (!chatStream.isStreaming.value) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
      })
      
      // 取消订阅
      unsubscribe()
      
      // 完成流式消息
      const finalContent = chatStream.streamedContent.value
      finishStreamingMessage(aiMessage.id, {
        content: finalContent,
        toolCalls: extractToolCallsFromStructuredData(chatStream.structuredData.value),
        trainingPlan: extractTrainingPlanFromStructuredData(chatStream.structuredData.value)
      })
      
      // 保存AI消息到IndexedDB（登录用户和游客都保存，确保刷新后不丢失）
      await chatHistoryDB.saveMessage({
        id: aiMessage.id,
        topicId: actualTopicId,
        userId,
        role: 'assistant',
        content: finalContent,
        timestamp: new Date().toISOString(),
        metadata: {
          tools_used: chatStream.structuredData.value
            .filter(d => d.type === 'dag_execution')
            .flatMap(d => d.data?.tools?.map((t: any) => t.name) || [])
        }
      })
      
      // 登录用户同时保存到后端
      if (isLoggedIn.value) {
        try {
          await topicApi.saveTopicMessage(actualTopicId, {
            role: 'assistant',
            content: finalContent,
            client_id: aiMessage.id,
            metadata: {
              tools_used: chatStream.structuredData.value
                .filter(d => d.type === 'dag_execution')
                .flatMap(d => d.data?.tools?.map((t: any) => t.name) || [])
            }
          })
        } catch (err) {
          console.warn('[ChatStore] 保存AI消息到后端失败:', err)
        }
      }
      
      // 更新话题信息
      await topicStore.updateTopicLocally(actualTopicId, {
        lastMessage: data.content,
        messageCount: messages.value.filter(m => m.topicId === actualTopicId).length
      })
      
      currentStreamingMessageId = null
      
      return { success: true, messageId: aiMessage.id }
    } catch (err: any) {
      error.value = err.message || '发送消息失败'
      
      // 移除失败的AI消息
      const lastMsg = messages.value[messages.value.length - 1]
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.streaming) {
        messages.value.pop()
      }
      
      currentStreamingMessageId = null
      
      return { success: false, message: error.value }
    } finally {
      loading.value = false
      streaming.value = false
    }
  }

  /**
   * 更新流式消息内容
   */
  function updateStreamingMessage(messageId: string, chunk: Partial<AIResponse>) {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) return
    
    if (chunk.content !== undefined) {
      message.content = chunk.content
    }
    
    if (chunk.toolCalls) {
      message.toolCalls = chunk.toolCalls
    }
    
    if (chunk.trainingPlan) {
      message.trainingPlan = chunk.trainingPlan
    }
    
    if (chunk.personalizationScore !== undefined) {
      message.personalizationScore = chunk.personalizationScore
    }
    
    if (chunk.profileUtilizationRate !== undefined) {
      message.profileUtilizationRate = chunk.profileUtilizationRate
    }
  }

  /**
   * 完成流式消息
   */
  function finishStreamingMessage(messageId: string, finalData?: Partial<AIResponse>) {
    const message = messages.value.find(m => m.id === messageId)
    if (!message) return
    
    message.streaming = false
    
    if (finalData) {
      if (finalData.toolCalls) {
        message.toolCalls = finalData.toolCalls
      }
      if (finalData.trainingPlan) {
        message.trainingPlan = finalData.trainingPlan
      }
      if (finalData.personalizationScore !== undefined) {
        message.personalizationScore = finalData.personalizationScore
      }
      if (finalData.profileUtilizationRate !== undefined) {
        message.profileUtilizationRate = finalData.profileUtilizationRate
      }
    }
  }

  /**
   * 从structuredData中提取训练计划
   */
  function extractTrainingPlanFromStructuredData(structuredData: any[]): TrainingPlan | undefined {
    for (const item of structuredData) {
      if (item.type === 'training_plan' && item.data) {
        return item.data as TrainingPlan
      }
    }
    return undefined
  }
  
  /**
   * 从structuredData中提取工具调用信息
   */
  function extractToolCallsFromStructuredData(structuredData: any[]): ToolCall[] | undefined {
    const toolCalls: ToolCall[] = []
    
    for (const item of structuredData) {
      if (item.type === 'dag_execution' && item.data) {
        const dagExecution = item.data
        
        if (dagExecution.tools && Array.isArray(dagExecution.tools)) {
          dagExecution.tools.forEach((tool: any, index: number) => {
            toolCalls.push({
              id: `tool-${index}`,
              name: tool.name || tool.tool_name || 'unknown',
              displayName: tool.display_name || tool.name,
              status: tool.status || 'success',
              startTime: tool.start_time || Date.now(),
              endTime: tool.end_time,
              duration: tool.duration,
              parameters: tool.parameters,
              result: tool.result,
              error: tool.error,
              dataSource: tool.data_source || tool.metadata?.data_source
            })
          })
        }
      }
    }
    
    return toolCalls.length > 0 ? toolCalls : undefined
  }
  
  /**
   * 解析AI回复中的工具调用信息
   */
  function parseToolCalls(metadata?: Record<string, any>): ToolCall[] | undefined {
    if (!metadata || !metadata.dag_execution) return undefined
    
    const dagExecution = metadata.dag_execution
    const toolCalls: ToolCall[] = []
    
    if (dagExecution.tools && Array.isArray(dagExecution.tools)) {
      dagExecution.tools.forEach((tool: any, index: number) => {
        toolCalls.push({
          id: `tool-${index}`,
          name: tool.name || tool.tool_name || 'unknown',
          displayName: tool.display_name || tool.name,
          status: tool.status || 'success',
          startTime: tool.start_time || Date.now(),
          endTime: tool.end_time,
          duration: tool.duration,
          parameters: tool.parameters,
          result: tool.result,
          error: tool.error,
          dataSource: tool.data_source || tool.metadata?.data_source
        })
      })
    }
    
    return toolCalls.length > 0 ? toolCalls : undefined
  }

  /**
   * 导入训练计划
   * 将AI生成的TrainingPlan格式转换为后端API期望的格式
   */
  async function importTrainingPlan(plan: TrainingPlan): Promise<{ success: boolean; message?: string }> {
    try {
      // 从AI生成的TrainingPlan格式提取数据
      const overview = plan.program_overview || {}
      
      // 优先使用weekly_program，如果training_days为空则尝试从weekly_programs获取
      let weeklyProgram = plan.weekly_program || {}
      if (!weeklyProgram.training_days || weeklyProgram.training_days.length === 0) {
        // 尝试从weekly_programs数组获取第一周数据
        const weeklyPrograms = (plan as any).weekly_programs
        if (weeklyPrograms && Array.isArray(weeklyPrograms) && weeklyPrograms.length > 0) {
          weeklyProgram = weeklyPrograms[0]
          console.log('[ChatStore] 从weekly_programs获取第一周数据')
        }
      }
      
      const safetyAssessment = plan.safety_assessment || {}
      
      // 生成计划名称
      const splitTypeMap: Record<string, string> = {
        'full_body': '全身训练',
        'upper_lower': '上下肢分化',
        'push_pull_legs': '推拉腿分化',
        'bro_split': '部位分化'
      }
      const splitName = splitTypeMap[overview.training_split] || overview.training_split || '训练计划'
      const planName = overview.program_name || `AI定制${splitName}`
      
      // 提取所有动作（从training_days中）
      const exercises: any[] = []
      const trainingDays = weeklyProgram.training_days || []
      trainingDays.forEach((day: any) => {
        if (day.exercises && Array.isArray(day.exercises)) {
          day.exercises.forEach((ex: any) => {
            exercises.push({
              day_number: day.day_number,
              day_name: day.day_name,
              exercise_id: ex.exercise_id,
              name_zh: ex.name_zh,
              sets: ex.sets,
              reps_range: ex.reps_range,
              rest_seconds: ex.rest_seconds,
              weight: ex.weight
            })
          })
        }
      })
      
      // 提取目标肌群
      const targetMuscles: string[] = []
      trainingDays.forEach((day: any) => {
        if (day.focus_muscle_groups && Array.isArray(day.focus_muscle_groups)) {
          day.focus_muscle_groups.forEach((muscle: string) => {
            if (!targetMuscles.includes(muscle)) {
              targetMuscles.push(muscle)
            }
          })
        }
      })
      
      // 映射难度等级
      const difficultyMap: Record<string, 'beginner' | 'intermediate' | 'advanced'> = {
        'beginner': 'beginner',
        'intermediate': 'intermediate',
        'advanced': 'advanced',
        '初级': 'beginner',
        '中级': 'intermediate',
        '高级': 'advanced'
      }
      const difficulty = difficultyMap[overview.difficulty_level] || 'intermediate'
      
      // 构建后端API期望的数据格式
      const importData = {
        name: planName,
        description: `目标: ${overview.training_goal || '综合健身'} | 每周${overview.training_days_per_week || 3}天`,
        weeks: 12, // 默认12周计划
        frequency: overview.training_days_per_week || 3,
        exercises: exercises,
        target_muscles: targetMuscles,
        safety_notes: safetyAssessment.safety_recommendations || [],
        difficulty: difficulty
      }
      
      console.log('[ChatStore] 导入训练计划数据:', importData)
      
      const response = await importPlanAPI(importData)
      
      if (response.code === 200) {
        toast({
          title: '导入成功',
          description: `训练计划"${planName}"已添加到您的计划列表`,
          duration: 3000
        })
        return { success: true }
      } else {
        throw new Error(response.msg || '导入失败')
      }
    } catch (err: any) {
      const errorMsg = err.message || '导入训练计划失败'
      console.error('[ChatStore] 导入训练计划失败:', err)
      toast({
        title: '导入失败',
        description: errorMsg,
        variant: 'destructive'
      })
      return { success: false, message: errorMsg }
    }
  }

  /**
   * 清空指定话题的消息
   */
  function clearMessages(topicId?: string) {
    if (topicId) {
      messages.value = messages.value.filter(m => m.topicId !== topicId)
    } else {
      messages.value = []
    }
  }

  /**
   * 删除单条消息
   */
  function deleteMessage(messageId: string) {
    const index = messages.value.findIndex(m => m.id === messageId)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
  }

  /**
   * 提交评分
   */
  async function submitRating(rating: Rating): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await submitRatingAPI(rating)
      
      if (response.code === 200) {
        const message = messages.value.find(m => m.id === rating.messageId)
        if (message) {
          message.rating = rating
        }
        
        toast({
          title: '评分成功',
          description: '感谢您的反馈！',
          duration: 3000
        })
        
        return { success: true }
      } else {
        throw new Error(response.msg || '提交评分失败')
      }
    } catch (err: any) {
      const errorMsg = err.message || '提交评分失败'
      toast({
        title: '评分失败',
        description: errorMsg,
        variant: 'destructive'
      })
      return { success: false, message: errorMsg }
    }
  }

  /**
   * 生成消息ID
   */
  function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  return {
    // State
    messages,
    loading,
    streaming,
    error,
    
    // Getters
    isLoggedIn,
    getMessagesByTopic,
    lastMessage,
    
    // Actions
    loadMessages,
    sendMessage,
    updateStreamingMessage,
    finishStreamingMessage,
    parseToolCalls,
    clearMessages,
    deleteMessage,
    importTrainingPlan,
    submitRating,
  }
})
