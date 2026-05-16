<script setup lang="ts">
/**
 * MessageItemNew — 适配 useYuzhenChat 的单条消息渲染
 *
 * 功能：
 * - 用户消息：右对齐，primary 背景
 * - AI 消息：左对齐，Markdown 渲染 + 工具卡片 + 训练计划卡片
 * - 工具调用：ToolCallCardNew（折叠/展开 + 结构化渲染）
 * - 训练计划：从 toolCalls 中提取，渲染 TrainingPlanCard
 * - 元数据：模型/token 用量
 * - 动作链接：点击跳转详情页
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Bot } from 'lucide-vue-next'
import ToolCallCardNew from './ToolCallCardNew.vue'
import TrainingPlanCard from '@/components/training/TrainingPlanCard.vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import type { ChatMessage } from '@/composables/useYuzhenChat'
import { extractTrainingPlanFromToolCalls } from '@/utils/adapters/toolCallAdapter'

const router = useRouter()

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
})

const purifyConfig = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'u', 's', 'code', 'pre',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'blockquote',
    'div', 'span',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel',
    'src', 'alt', 'title',
    'class', 'id',
  ],
}

interface Props {
  message: ChatMessage
}

const props = defineProps<Props>()

// 格式化时间戳
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 渲染 Markdown
const renderedContent = computed(() => {
  if (!props.message.content) return ''
  try {
    const rawHtml = marked.parse(props.message.content) as string
    return DOMPurify.sanitize(rawHtml, purifyConfig)
  } catch {
    return props.message.content
  }
})

// 工具调用
const hasToolCalls = computed(() => {
  return props.message.toolCalls && props.message.toolCalls.length > 0
})

// 从工具调用中提取训练计划
const trainingPlan = computed(() => {
  if (!props.message.toolCalls) return null
  return extractTrainingPlanFromToolCalls(props.message.toolCalls)
})

// 元数据（积分消耗，替代 tokens 显示）
const metaText = computed(() => {
  if (!props.message.runtime) return null
  const parts: string[] = []
  if (props.message.runtime.modelId) {
    parts.push(props.message.runtime.modelId)
  }
  // TODO: 替换为积分消耗（Phase 5）
  return parts.length > 0 ? parts.join(' · ') : null
})

// 导入训练计划
function handleImportPlan() {
  // TODO: 调用 save_training_plan 或 Laravel API
  console.log('[MessageItemNew] Import plan:', trainingPlan.value)
}

// 动作链接点击
function handleContentClick(event: MouseEvent) {
  const target = event.target as HTMLElement
  const link = target.closest('a[href*="/exercise/"]')
  if (link) {
    event.preventDefault()
    const href = link.getAttribute('href') || ''
    router.push(href)
  }
}
</script>

<template>
  <div class="message-item w-full">
    <!-- 用户消息 -->
    <div v-if="message.role === 'user'" class="flex items-start gap-3 justify-end">
      <div class="flex flex-col items-end gap-1 max-w-[80%]">
        <div class="rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground">
          <p class="text-sm whitespace-pre-wrap break-words">{{ message.content }}</p>
        </div>
        <span class="text-xs text-muted-foreground">{{ formatTime(message.timestamp) }}</span>
      </div>
      <Avatar class="h-8 w-8 shrink-0">
        <AvatarFallback class="bg-primary/10">
          <User class="h-4 w-4 text-primary" />
        </AvatarFallback>
      </Avatar>
    </div>

    <!-- AI 消息 -->
    <div v-else-if="message.role === 'assistant'" class="flex items-start gap-3">
      <Avatar class="h-8 w-8 shrink-0">
        <AvatarFallback class="bg-blue-500/10">
          <Bot class="h-4 w-4 text-blue-600" />
        </AvatarFallback>
      </Avatar>

      <div class="flex flex-col gap-2 max-w-[85%]">
        <!-- Markdown 消息内容 -->
        <div v-if="message.content" class="rounded-2xl bg-muted px-4 py-2.5">
          <div
            class="text-sm prose prose-sm max-w-none dark:prose-invert"
            @click="handleContentClick"
            v-html="renderedContent"
          />
        </div>

        <!-- 训练计划卡片（从工具结果中提取） -->
        <TrainingPlanCard
          v-if="trainingPlan"
          :plan="trainingPlan"
          :show-import-button="true"
          @import="handleImportPlan"
        />

        <!-- 工具调用卡片 -->
        <div v-if="hasToolCalls" class="space-y-1.5">
          <div v-if="message.toolCalls!.length > 1" class="text-xs text-muted-foreground px-1">
            {{ message.toolCalls!.length }} 个工具调用
          </div>
          <ToolCallCardNew
            v-for="tc in message.toolCalls"
            :key="tc.id"
            :tool-call="tc"
          />
        </div>

        <!-- 元数据 -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground">{{ formatTime(message.timestamp) }}</span>
          <span v-if="metaText" class="text-xs text-muted-foreground/60">{{ metaText }}</span>
        </div>
      </div>
    </div>

    <!-- 系统消息 -->
    <div v-else-if="message.role === 'system'" class="flex justify-center">
      <div class="rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
        {{ message.content }}
      </div>
    </div>

    <!-- 工具消息（通常不直接显示） -->
    <div v-else-if="message.role === 'tool'" class="flex justify-center">
      <div class="rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground italic">
        [工具执行完成]
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Markdown 内容样式 */
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
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4) {
  @apply font-semibold mt-4 mb-2 first:mt-0;
}

:deep(.prose h1) { @apply text-lg; }
:deep(.prose h2) { @apply text-base; }
:deep(.prose h3),
:deep(.prose h4) { @apply text-sm; }

:deep(.prose p) { @apply my-2 first:mt-0 last:mb-0; }
:deep(.prose ul),
:deep(.prose ol) { @apply my-2 pl-5; }
:deep(.prose li) { @apply my-1; }
:deep(.prose code) { @apply bg-muted/50 px-1 py-0.5 rounded text-xs; }
:deep(.prose pre) { @apply bg-muted/50 p-3 rounded-lg overflow-x-auto my-2; }
:deep(.prose pre code) { @apply bg-transparent p-0; }
:deep(.prose blockquote) { @apply border-l-2 border-border pl-3 italic my-2; }
:deep(.prose table) { @apply w-full border-collapse my-2; }
:deep(.prose th),
:deep(.prose td) { @apply border border-border px-2 py-1 text-left; }
:deep(.prose th) { @apply bg-muted/50 font-medium; }
:deep(.prose a) { @apply text-primary underline cursor-pointer; }
:deep(.prose strong) { @apply font-semibold; }
:deep(.prose hr) { @apply border-border my-4; }
</style>
