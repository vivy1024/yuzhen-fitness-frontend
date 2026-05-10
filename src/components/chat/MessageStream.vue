<script setup lang="ts">
/**
 * MessageStream — 消息流容器
 * 自动滚动到底部 + 流式内容显示
 */
import { ref, watch, nextTick, onMounted } from 'vue'
import MessageItemNew from './MessageItemNew.vue'
import type { ChatMessage } from '@/composables/useYuzhenChat'

interface Props {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
}

const props = defineProps<Props>()

const containerRef = ref<HTMLElement | null>(null)
const isAutoScroll = ref(true)

function scrollToBottom() {
  if (!containerRef.value) return
  containerRef.value.scrollTop = containerRef.value.scrollHeight
}

function handleScroll() {
  if (!containerRef.value) return
  const { scrollTop, scrollHeight, clientHeight } = containerRef.value
  // 如果用户滚动到距底部 80px 以内，认为在底部
  isAutoScroll.value = scrollHeight - scrollTop - clientHeight < 80
}

// 新消息时自动滚底
watch(
  () => props.messages.length,
  async () => {
    if (isAutoScroll.value) {
      await nextTick()
      scrollToBottom()
    }
  }
)

// 流式内容更新时自动滚底
watch(
  () => props.streamingContent,
  async () => {
    if (isAutoScroll.value) {
      await nextTick()
      scrollToBottom()
    }
  }
)

onMounted(() => {
  scrollToBottom()
})

defineExpose({ scrollToBottom })
</script>

<template>
  <div
    ref="containerRef"
    class="flex-1 overflow-y-auto px-4 py-6"
    @scroll="handleScroll"
  >
    <!-- 空状态 -->
    <div
      v-if="messages.length === 0 && !isStreaming"
      class="flex h-full flex-col items-center justify-center gap-4 text-center"
    >
      <div class="text-4xl">💪</div>
      <div class="space-y-2">
        <h2 class="text-xl font-semibold">开始您的健身之旅</h2>
        <p class="text-sm text-muted-foreground">
          向智能健身顾问提问，获取专业的训练建议
        </p>
      </div>
      <p class="mt-4 text-xs text-muted-foreground max-w-sm">
        AI 建议仅供参考，不构成医疗建议。如有健康问题请先咨询专业医生。
      </p>
    </div>

    <!-- 消息列表 -->
    <div v-else class="space-y-4">
      <MessageItemNew
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />

      <!-- 流式内容气泡 -->
      <div v-if="isStreaming && streamingContent" class="flex items-start gap-3">
        <div class="h-8 w-8 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center">
          <svg class="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
        </div>
        <div class="flex flex-col gap-1 max-w-[80%]">
          <div class="rounded-2xl bg-muted px-4 py-2.5">
            <div class="text-sm whitespace-pre-wrap break-words">
              {{ streamingContent }}<span class="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        </div>
      </div>

      <!-- 流式中但无内容时显示打字指示器 -->
      <div v-else-if="isStreaming && !streamingContent" class="flex items-start gap-3">
        <div class="h-8 w-8 shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center">
          <svg class="h-4 w-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M9 18h6" />
            <path d="M10 22h4" />
          </svg>
        </div>
        <div class="rounded-2xl bg-muted px-4 py-2.5">
          <div class="flex items-center gap-1">
            <div class="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce" style="animation-delay: 0ms" />
            <div class="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce" style="animation-delay: 150ms" />
            <div class="h-1.5 w-1.5 rounded-full bg-blue-600 animate-bounce" style="animation-delay: 300ms" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
