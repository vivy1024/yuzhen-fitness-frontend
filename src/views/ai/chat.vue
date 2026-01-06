<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useTopicStore } from '@/stores/topic'
import { useStreamingStore } from '@/stores/streaming'
import { useUserStore } from '@/stores/user'
import { useMembershipStore } from '@/stores/membership'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import MessageItem from '@/components/chat/MessageItem.vue'
import TopicSidebar from '@/components/chat/TopicSidebar.vue'
import ToolCallDialog from '@/components/chat/ToolCallDialog.vue'
import DAGTemplateSelector from '@/components/chat/DAGTemplateSelector.vue'
import type { TrainingPlan } from '@/components/training/TrainingPlanCard.vue'
import type { Rating } from '@/components/chat/RatingDialog.vue'
import type { DAGTemplate } from '@/config/dag-templates'
import { showInfo } from '@/components/ui/toast'
import { Send, Menu, Loader2, Home, Plus, Wrench, AlertCircle, X, Sparkles } from 'lucide-vue-next'

const router = useRouter()
const chatStore = useChatStore()
const topicStore = useTopicStore()
const streamingStore = useStreamingStore()
const userStore = useUserStore()
const membershipStore = useMembershipStore()

// State
const messageInput = ref('')
const showTopicSidebar = ref(false)
const showToolCallDialog = ref(false)
const showTemplateSelector = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const dismissedProfileAlert = ref(false)

// 检查用户档案是否完整（基础必填字段）
const profileIncomplete = computed(() => {
  const profile = userStore.userProfile
  if (!profile) return true
  
  const basicInfo = profile.basic_info
  // 检查关键字段：性别、年龄、身高、体重、健身水平
  return !basicInfo?.gender || 
         !basicInfo?.age || 
         !basicInfo?.height || 
         !basicInfo?.weight || 
         !basicInfo?.fitness_level
})

// 获取缺失的字段列表
const missingFields = computed(() => {
  const profile = userStore.userProfile
  const missing: string[] = []
  
  if (!profile?.basic_info?.gender) missing.push('性别')
  if (!profile?.basic_info?.age) missing.push('年龄')
  if (!profile?.basic_info?.height) missing.push('身高')
  if (!profile?.basic_info?.weight) missing.push('体重')
  if (!profile?.basic_info?.fitness_level) missing.push('健身水平')
  
  return missing
})

// 是否显示档案提醒
const showProfileAlert = computed(() => {
  return profileIncomplete.value && !dismissedProfileAlert.value
})

// 工具调用历史（从消息中提取）
const toolCallHistory = computed(() => {
  const history: any[] = []
  currentMessages.value.forEach(msg => {
    if (msg.metadata?.tools_used && msg.metadata.tools_used.length > 0) {
      history.push({
        messageId: msg.id,
        timestamp: msg.timestamp,
        tools: msg.metadata.tools_used,
        executionTime: msg.metadata.execution_time,
        model: msg.metadata.model_used
      })
    }
  })
  return history
})

// 格式化工具调用数据为ToolCallDialog需要的格式
const formattedToolCalls = computed(() => {
  const calls: any[] = []
  let callIndex = 0
  
  toolCallHistory.value.forEach(history => {
    history.tools.forEach((toolName: string) => {
      calls.push({
        id: `tool-${callIndex++}`,
        name: toolName,
        displayName: getToolDisplayName(toolName),
        status: 'success' as const,
        startTime: new Date(history.timestamp).getTime(),
        endTime: new Date(history.timestamp).getTime() + (history.executionTime || 0),
        duration: history.executionTime,
        dataSource: getToolDataSource(toolName)
      })
    })
  })
  
  return calls
})

// 获取工具的数据来源标识
function getToolDataSource(toolName: string): string {
  const dataSourceMap: Record<string, string> = {
    'intelligent_exercise_selector': '基于1790个专业动作数据库',
    'contraindications_checker': '基于专业医学禁忌症知识库',
    'injury_risk_assessor': '基于运动损伤风险评估模型',
    'muscle_group_volume_calculator': '基于肌群训练量科学研究',
    'tdee_calculator': '基于Mifflin-St Jeor公式',
    'professional_program_designer': '基于专业训练计划设计系统',
    'exercise_alternative_finder': '基于1790个专业动作数据库',
    'movement_pattern_balancer': '基于动作模式平衡理论',
    'intelligent_weight_calculator': '基于渐进式超负荷原则',
    'safe_exercise_modifier': '基于运动安全修改指南',
    'nutrition_intake_analyzer': '基于1880个食物营养数据库',
    'meal_plan_designer': '基于营养学膳食设计原则',
    'exercise_nutrition_optimization': '基于运动营养优化研究',
    'record_training_feedback': '用户训练反馈系统',
    'periodized_program_designer': '基于周期化训练理论',
    'training_split_designer': '基于训练分化设计原则',
    'find_similar_training_cases': '基于相似案例匹配算法',
    'get_user_profile': '用户个人档案数据'
  }
  return dataSourceMap[toolName] || 'DAML-RAG智能分析系统'
}

// 获取工具的中文显示名称
function getToolDisplayName(toolName: string): string {
  const toolNameMap: Record<string, string> = {
    'intelligent_exercise_selector': '智能动作选择',
    'contraindications_checker': '禁忌症检查',
    'injury_risk_assessor': '损伤风险评估',
    'muscle_group_volume_calculator': '肌群训练量计算',
    'tdee_calculator': 'TDEE计算',
    'professional_program_designer': '专业训练计划设计',
    'exercise_alternative_finder': '动作替代查找',
    'movement_pattern_balancer': '动作模式平衡',
    'intelligent_weight_calculator': '智能负重计算',
    'safe_exercise_modifier': '安全动作修改',
    'nutrition_intake_analyzer': '营养摄入分析',
    'meal_plan_designer': '膳食计划设计',
    'exercise_nutrition_optimization': '运动营养优化',
    'record_training_feedback': '记录训练反馈',
    'periodized_program_designer': '周期化训练设计',
    'training_split_designer': '训练分化设计',
    'find_similar_training_cases': '查找相似训练案例',
    'get_user_profile': '获取用户档案'
  }
  return toolNameMap[toolName] || toolName
}

// Computed
const currentMessages = computed(() => {
  if (!topicStore.currentTopicId) return []
  return chatStore.getMessagesByTopic(topicStore.currentTopicId)
})

const canSend = computed(() => {
  return messageInput.value.trim().length > 0 && !chatStore.loading && !chatStore.streaming
})

const isStreaming = computed(() => chatStore.streaming)

// Methods

/**
 * 发送消息
 * 参考V2实现，直接调用DAML-RAG流式API
 */
async function sendMessage() {
  if (!canSend.value) return

  const content = messageInput.value.trim()
  messageInput.value = ''
  
  // 如果没有当前话题，创建一个新话题
  if (!topicStore.currentTopicId) {
    const result = await topicStore.createNewTopic({
      name: content.slice(0, 20) + (content.length > 20 ? '...' : '')
    })
    
    if (!result.success) {
      console.error('创建话题失败:', result.message)
      // 即使创建失败也继续，使用临时ID
      const tempId = `temp_${Date.now()}`
      topicStore.setCurrentTopic(tempId)
    }
  }
  
  // 发送消息
  const result = await chatStore.sendMessage({
    content,
    topicId: topicStore.currentTopicId!
  })
  
  if (result.success) {
    // 滚动到底部
    await nextTick()
    scrollToBottom()
  }
}

/**
 * 滚动到底部
 */
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

/**
 * 处理话题切换
 */
async function handleTopicChange(topicId: string) {
  topicStore.setCurrentTopic(topicId)
  await chatStore.loadMessages(topicId)
  showTopicSidebar.value = false
  
  await nextTick()
  scrollToBottom()
}

/**
 * 处理新话题创建
 */
async function handleNewTopic() {
  const result = await topicStore.createNewTopic({
    name: '新对话'
  })
  
  if (result.success) {
    showTopicSidebar.value = false
  }
}

/**
 * 处理训练计划导入
 */
async function handleImportPlan(plan: TrainingPlan) {
  await chatStore.importTrainingPlan(plan)
}

/**
 * 处理查看训练计划详情
 */
function handleViewPlanDetail(plan: TrainingPlan) {
  // TODO: 跳转到训练计划详情页
  console.log('查看训练计划详情:', plan)
}

/**
 * 处理评分提交
 */
async function handleSubmitRating(rating: Rating) {
  await chatStore.submitRating(rating)
}

/**
 * 返回首页
 */
function goHome() {
  router.push('/')
}

/**
 * 跳转到档案编辑页面
 */
function goToProfileEdit() {
  router.push('/user-profile/edit')
}

/**
 * 关闭档案提醒
 */
function dismissProfileAlert() {
  dismissedProfileAlert.value = true
}

/**
 * 删除话题
 */
async function handleDeleteTopic(topicId: string) {
  const result = await topicStore.removeTopic(topicId)
  if (result.success) {
    // 如果删除的是当前话题，清空消息
    if (topicId === topicStore.currentTopicId) {
      chatStore.clearMessages()
    }
  }
}

/**
 * 处理DAG模板快捷提示选择
 */
function handleSelectPrompt(prompt: string) {
  messageInput.value = prompt
  showTemplateSelector.value = false
}

/**
 * 处理需要升级会员的模板
 */
function handleUpgradeRequired(template: DAGTemplate) {
  showInfo(`"${template.name}"需要${template.membershipRequired === 'warmheart' ? '暖心会员' : '能量会员'}，点击升级解锁更多AI场景`)
  router.push('/membership')
}

/**
 * 切换模板选择器显示
 */
function toggleTemplateSelector() {
  showTemplateSelector.value = !showTemplateSelector.value
}

// Lifecycle
onMounted(async () => {
  // 标记进入聊天页面
  streamingStore.setOnChatPage(true)
  
  // 初始化用户档案（检查是否完整）
  await userStore.init()
  
  // 初始化会员store
  await membershipStore.init()
  
  // 初始化话题store
  topicStore.init()
  
  // 加载话题列表
  await topicStore.fetchTopics()
  
  // 如果有当前话题，加载消息
  if (topicStore.currentTopicId) {
    await chatStore.loadMessages(topicStore.currentTopicId)
    await nextTick()
    scrollToBottom()
  }
})

onUnmounted(() => {
  // 标记离开聊天页面
  streamingStore.setOnChatPage(false)
})
</script>

<template>
  <div class="flex h-screen flex-col bg-background">
    <!-- 顶部导航栏 -->
    <div class="flex h-14 items-center justify-between border-b px-4">
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          @click="goHome"
          title="返回首页"
        >
          <Home class="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          @click="showTopicSidebar = true"
        >
          <Menu class="h-5 w-5" />
        </Button>
        <h1 class="text-lg font-semibold truncate max-w-[150px]">
          {{ topicStore.currentTopic?.name || '智能健身顾问' }}
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <!-- 工具调用历史按钮 -->
        <Button
          v-if="toolCallHistory.length > 0"
          variant="ghost"
          size="icon"
          @click="showToolCallDialog = true"
          title="查看工具调用"
        >
          <Wrench class="h-5 w-5" />
        </Button>
        <!-- 新建话题按钮 -->
        <Button
          variant="ghost"
          size="icon"
          @click="handleNewTopic"
          title="新建话题"
        >
          <Plus class="h-5 w-5" />
        </Button>
      </div>
    </div>

    <!-- 用户档案不完整提醒 -->
    <div v-if="showProfileAlert" class="px-4 pt-3">
      <Alert class="bg-amber-50 border-amber-200">
        <AlertCircle class="h-4 w-4 text-amber-600" />
        <AlertDescription class="flex items-center justify-between">
          <div class="text-amber-800">
            <span class="font-medium">完善档案获得更精准建议：</span>
            <span class="text-amber-600">缺少{{ missingFields.join('、') }}</span>
          </div>
          <div class="flex items-center gap-2 ml-2 shrink-0">
            <Button 
              size="sm" 
              variant="outline"
              class="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
              @click="goToProfileEdit"
            >
              去完善
            </Button>
            <Button
              size="sm"
              variant="ghost"
              class="h-7 w-7 p-0 text-amber-600 hover:bg-amber-100"
              @click="dismissProfileAlert"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>

    <!-- 消息区域 -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto px-4 py-6"
    >
      <!-- 空状态 -->
      <div
        v-if="currentMessages.length === 0"
        class="flex h-full flex-col items-center justify-center gap-4 text-center"
      >
        <div class="text-4xl">💪</div>
        <div class="space-y-2">
          <h2 class="text-xl font-semibold">开始您的健身之旅</h2>
          <p class="text-sm text-muted-foreground">
            向智能健身顾问提问，获取专业的训练建议
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="messageInput = '帮我制定一个增肌训练计划'"
          >
            制定训练计划
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="messageInput = '推荐一些胸部训练动作'"
          >
            推荐训练动作
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="messageInput = '如何提高卧推重量？'"
          >
            训练技巧
          </Button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div v-else class="space-y-4">
        <MessageItem
          v-for="message in currentMessages"
          :key="message.id"
          :message="message"
          @import-plan="handleImportPlan"
          @view-plan-detail="handleViewPlanDetail"
          @submit-rating="handleSubmitRating"
        />
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="border-t p-4">
      <!-- DAG模板选择器 -->
      <div v-if="showTemplateSelector" class="mb-4">
        <DAGTemplateSelector
          @select-prompt="handleSelectPrompt"
          @upgrade-required="handleUpgradeRequired"
        />
      </div>

      <!-- 流式状态提示 -->
      <div
        v-if="isStreaming"
        class="mb-2 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Loader2 class="h-4 w-4 animate-spin" />
        <span>正在分析您的需求...</span>
      </div>
      
      <form
        class="flex gap-2"
        @submit.prevent="sendMessage"
      >
        <!-- AI场景按钮 -->
        <Button
          type="button"
          variant="outline"
          size="icon"
          @click="toggleTemplateSelector"
          :class="showTemplateSelector && 'bg-primary/10'"
          title="选择AI场景"
        >
          <Sparkles class="h-4 w-4" />
        </Button>
        
        <Input
          v-model="messageInput"
          placeholder="输入消息，或点击左侧选择AI场景..."
          class="flex-1"
          :disabled="chatStore.loading || isStreaming"
        />
        <Button
          type="submit"
          :disabled="!canSend"
        >
          <Send class="h-4 w-4" />
        </Button>
      </form>
      
      <!-- 免责声明 -->
      <p class="mt-2 text-xs text-muted-foreground text-center">
        本内容由智能系统辅助生成，仅供参考
      </p>
    </div>

    <!-- 话题侧边栏 -->
    <TopicSidebar
      v-model:visible="showTopicSidebar"
      :topics="topicStore.sortedTopics"
      :current-topic-id="topicStore.currentTopicId"
      @select-topic="handleTopicChange"
      @create-topic="handleNewTopic"
      @delete-topic="handleDeleteTopic"
    />

    <!-- 工具调用历史弹窗 -->
    <ToolCallDialog
      v-model:open="showToolCallDialog"
      :tool-calls="formattedToolCalls"
    />
  </div>
</template>
