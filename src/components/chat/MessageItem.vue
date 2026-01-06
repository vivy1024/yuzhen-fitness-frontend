<script setup lang="ts">
import { ref, computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Bot, Wrench, Star } from 'lucide-vue-next'
import ToolCallDialog from './ToolCallDialog.vue'
import TrainingPlanCard from '../training/TrainingPlanCard.vue'
import RatingDialog from './RatingDialog.vue'
import type { ToolCall } from './ToolCallTimeline.vue'
import type { TrainingPlan } from '../training/TrainingPlanCard.vue'
import type { Rating } from './RatingDialog.vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
// 从V2复刻的训练计划解析工具
import { 
  getMessageTextContent, 
  getMessageTrainingPlans,
  type TrainingPlan as ParsedTrainingPlan 
} from '@/utils/trainingPlanParser'
import { ariaLabels } from '@/utils/accessibility'

// 配置marked选项
marked.setOptions({
  breaks: true,
  gfm: true
})

// 配置DOMPurify
const purifyConfig = {
  ADD_ATTR: ['data-exercise-id', 'data-exercise-name', 'href', 'target'],
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'u', 's', 'code', 'pre',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote',
    'div', 'span'
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel',
    'src', 'alt', 'title',
    'class', 'id',
    'data-exercise-id', 'data-exercise-name'
  ]
}

/**
 * 消息数据接口
 */
export interface Message {
  id: string
  topicId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  
  // 工具调用（DAG模板执行记录）
  toolCalls?: ToolCall[]
  
  // 训练计划
  trainingPlan?: TrainingPlan
  
  // 评分
  rating?: any
  
  // 个性化指标
  personalizationScore?: number
  profileUtilizationRate?: number
  
  // 流式状态
  streaming?: boolean
  
  // 元数据（包含工具使用、模型、执行时间等）
  metadata?: {
    tools_used?: string[]
    model_used?: string
    execution_time?: number
    interaction_id?: string
    personalization_score?: number
    few_shot_examples_count?: number
    cache_hit?: boolean
  }
}

interface Props {
  message: Message
  showToolCalls?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showToolCalls: true
})

const emit = defineEmits<{
  importPlan: [plan: TrainingPlan]
  viewPlanDetail: [plan: TrainingPlan]
  submitRating: [rating: Rating]
}>()

// 工具调用对话框状态
const showToolCallDialog = ref(false)

// 评分对话框状态
const showRatingDialog = ref(false)

/**
 * 获取角色标签
 */
const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    user: '用户',
    assistant: 'AI助手',
    system: '系统'
  }
  return labels[role] || role
}

/**
 * 格式化时间戳
 */
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 小于1分钟显示"刚刚"
  if (diff < 60000) {
    return '刚刚'
  }
  
  // 小于1小时显示"X分钟前"
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  
  // 今天显示时间
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // 昨天显示"昨天 HH:mm"
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // 其他显示日期和时间
  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 判断是否有工具调用
 */
const hasToolCalls = computed(() => {
  return props.message.toolCalls && props.message.toolCalls.length > 0
})

/**
 * 成功的工具调用数量
 */
const successfulToolCalls = computed(() => {
  if (!props.message.toolCalls) return 0
  return props.message.toolCalls.filter(t => t.status === 'success').length
})

/**
 * 判断是否有训练计划（从message.trainingPlan或解析内容）
 */
const hasTrainingPlan = computed(() => {
  // 优先使用message.trainingPlan
  if (props.message.trainingPlan) return true
  // 否则从内容中解析
  return parsedTrainingPlans.value.length > 0
})

/**
 * 从AI回复内容中解析的训练计划列表
 * 使用从V2复刻的parseTrainingPlanData函数
 */
const parsedTrainingPlans = computed(() => {
  if (props.message.role !== 'assistant') return []
  if (props.message.streaming) return []
  return getMessageTrainingPlans(props.message.content)
})

/**
 * 获取所有训练计划（合并message.trainingPlan和解析的计划）
 */
const allTrainingPlans = computed(() => {
  const plans: any[] = []
  // 添加message.trainingPlan
  if (props.message.trainingPlan) {
    plans.push(props.message.trainingPlan)
  }
  // 添加从内容解析的计划
  plans.push(...parsedTrainingPlans.value)
  return plans
})

/**
 * 打开工具调用详情对话框
 */
const openToolCallDialog = () => {
  if (hasToolCalls.value) {
    showToolCallDialog.value = true
  }
}

/**
 * 处理训练计划导入
 */
const handleImportPlan = (plan: TrainingPlan) => {
  emit('importPlan', plan)
}

/**
 * 处理查看训练计划详情
 */
const handleViewPlanDetail = (plan: TrainingPlan) => {
  emit('viewPlanDetail', plan)
}

/**
 * 打开评分对话框
 */
const openRatingDialog = () => {
  showRatingDialog.value = true
}

/**
 * 处理评分提交
 */
const handleSubmitRating = (rating: Rating) => {
  emit('submitRating', rating)
}

/**
 * 判断是否已评分
 */
const isRated = computed(() => {
  return !!props.message.rating
})

/**
 * 渲染Markdown内容
 * 将AI返回的Markdown文本转换为HTML，并使用DOMPurify防止XSS攻击
 * 使用从V2复刻的getMessageTextContent函数移除训练计划JSON
 */
const renderedContent = computed(() => {
  if (!props.message.content) return ''
  try {
    // 使用V2的函数提取纯文本内容（移除[TRAINING_PLAN:{...}]）
    const textContent = props.message.role === 'assistant' 
      ? getMessageTextContent(props.message.content)
      : props.message.content
    
    const rawHtml = marked.parse(textContent) as string
    return DOMPurify.sanitize(rawHtml, purifyConfig)
  } catch (e) {
    console.error('Markdown解析错误:', e)
    return props.message.content
  }
})
</script>

<template>
  <div 
    :class="['message-item', `message-${message.role}`]"
    role="article"
    :aria-label="ariaLabels.chat.message(getRoleLabel(message.role), formatTime(message.timestamp))"
  >
    <!-- 用户消息 -->
    <div v-if="message.role === 'user'" class="flex items-start gap-3 justify-end">
      <div class="flex flex-col items-end gap-1 max-w-[80%]">
        <!-- 消息气泡 -->
        <div class="rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
          <p class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>
        </div>
        
        <!-- 时间戳 -->
        <span class="text-xs text-muted-foreground">{{ formatTime(message.timestamp) }}</span>
      </div>
      
      <!-- 用户头像 -->
      <Avatar class="h-8 w-8 shrink-0">
        <AvatarFallback class="bg-primary/10">
          <User class="h-4 w-4 text-primary" />
        </AvatarFallback>
      </Avatar>
    </div>

    <!-- AI消息 -->
    <div v-else-if="message.role === 'assistant'" class="flex items-start gap-3">
      <!-- AI头像 -->
      <Avatar class="h-8 w-8 shrink-0">
        <AvatarFallback class="bg-blue-500/10">
          <Bot class="h-4 w-4 text-blue-600" />
        </AvatarFallback>
      </Avatar>
      
      <div class="flex flex-col gap-2 max-w-[80%]">
        <!-- 消息气泡 -->
        <div class="rounded-2xl bg-muted px-4 py-2.5">
          <div 
            class="text-sm prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground"
            v-html="renderedContent"
          />
          
          <!-- 流式打字指示器 -->
          <div v-if="message.streaming" class="flex items-center gap-1 mt-2">
            <div class="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce" style="animation-delay: 0ms" />
            <div class="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce" style="animation-delay: 150ms" />
            <div class="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce" style="animation-delay: 300ms" />
          </div>
        </div>
        
        <!-- 工具调用标签 -->
        <div v-if="showToolCalls && hasToolCalls && !message.streaming" class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="h-7 gap-1.5 text-xs"
            :aria-label="ariaLabels.chat.toolCalls(message.toolCalls!.length)"
            @click="openToolCallDialog"
          >
            <Wrench class="h-3.5 w-3.5" aria-hidden="true" />
            <span>专业工具</span>
            <Badge variant="secondary" class="ml-1 h-5 px-1.5 text-xs" aria-label="`${successfulToolCalls} 个成功，共 ${message.toolCalls!.length} 个`">
              {{ successfulToolCalls }}/{{ message.toolCalls!.length }}
            </Badge>
          </Button>
        </div>
        
        <!-- 训练计划卡片 - 在消息气泡外部渲染（与V2一致） -->
        <div v-if="hasTrainingPlan && !message.streaming" class="mt-2 space-y-3">
          <TrainingPlanCard
            v-for="(plan, index) in allTrainingPlans"
            :key="`plan-${message.id}-${index}`"
            :plan="plan"
            @import="handleImportPlan"
            @view-detail="handleViewPlanDetail"
          />
        </div>
        
        <!-- 个性化指标 -->
        <div v-if="message.personalizationScore !== undefined && !message.streaming" class="flex items-center gap-2 text-xs text-muted-foreground">
          <span>个性化程度: {{ Math.round(message.personalizationScore * 100) }}%</span>
          <span v-if="message.profileUtilizationRate !== undefined">
            档案利用率: {{ Math.round(message.profileUtilizationRate * 100) }}%
          </span>
        </div>
        
        <!-- 评分按钮 -->
        <div v-if="!message.streaming" class="flex items-center gap-2">
          <Button
            v-if="!isRated"
            variant="ghost"
            size="sm"
            class="h-7 gap-1.5 text-xs"
            :aria-label="ariaLabels.chat.rating"
            @click="openRatingDialog"
          >
            <Star class="h-3.5 w-3.5" aria-hidden="true" />
            <span>评分</span>
          </Button>
          <div v-else class="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
            <Star class="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span>已评分</span>
          </div>
        </div>
        
        <!-- 时间戳 -->
        <span class="text-xs text-muted-foreground">{{ formatTime(message.timestamp) }}</span>
      </div>
    </div>

    <!-- 系统消息 -->
    <div v-else-if="message.role === 'system'" class="flex justify-center">
      <div class="rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
        {{ message.content }}
      </div>
    </div>

    <!-- 工具调用详情对话框 -->
    <ToolCallDialog
      v-if="hasToolCalls"
      v-model:open="showToolCallDialog"
      :tool-calls="message.toolCalls!"
    />
    
    <!-- 评分对话框 -->
    <RatingDialog
      v-if="message.role === 'assistant'"
      v-model:open="showRatingDialog"
      :message-id="message.id"
      :personalization-score="message.personalizationScore"
      @submit="handleSubmitRating"
    />
  </div>
</template>

<style scoped>
.message-item {
  @apply w-full;
}

/* 流式打字动画 */
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

/* Markdown内容样式 */
:deep(.prose) {
  --tw-prose-body: hsl(var(--foreground));
  --tw-prose-headings: hsl(var(--foreground));
  --tw-prose-links: hsl(var(--primary));
  --tw-prose-bold: hsl(var(--foreground));
  --tw-prose-counters: hsl(var(--muted-foreground));
  --tw-prose-bullets: hsl(var(--muted-foreground));
  --tw-prose-hr: hsl(var(--border));
  --tw-prose-quotes: hsl(var(--foreground));
  --tw-prose-quote-borders: hsl(var(--border));
  --tw-prose-code: hsl(var(--foreground));
  --tw-prose-pre-code: hsl(var(--foreground));
  --tw-prose-pre-bg: hsl(var(--muted));
  --tw-prose-th-borders: hsl(var(--border));
  --tw-prose-td-borders: hsl(var(--border));
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4) {
  @apply font-semibold mt-4 mb-2 first:mt-0;
}

:deep(.prose h1) {
  @apply text-lg;
}

:deep(.prose h2) {
  @apply text-base;
}

:deep(.prose h3),
:deep(.prose h4) {
  @apply text-sm;
}

:deep(.prose p) {
  @apply my-2 first:mt-0 last:mb-0;
}

:deep(.prose ul),
:deep(.prose ol) {
  @apply my-2 pl-5;
}

:deep(.prose li) {
  @apply my-1;
}

:deep(.prose code) {
  @apply bg-muted/50 px-1 py-0.5 rounded text-xs;
}

:deep(.prose pre) {
  @apply bg-muted/50 p-3 rounded-lg overflow-x-auto my-2;
}

:deep(.prose pre code) {
  @apply bg-transparent p-0;
}

:deep(.prose blockquote) {
  @apply border-l-2 border-border pl-3 italic my-2;
}

:deep(.prose table) {
  @apply w-full border-collapse my-2;
}

:deep(.prose th),
:deep(.prose td) {
  @apply border border-border px-2 py-1 text-left;
}

:deep(.prose th) {
  @apply bg-muted/50 font-medium;
}

:deep(.prose a) {
  @apply text-primary underline;
}

:deep(.prose strong) {
  @apply font-semibold;
}

:deep(.prose hr) {
  @apply border-border my-4;
}
</style>
