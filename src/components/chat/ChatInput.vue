<script setup lang="ts">
/**
 * ChatInput — 输入框组件
 * 
 * - Enter 发送，Shift+Enter 换行
 * - 工作中显示停止按钮
 * - 支持 disabled 状态
 */
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Send, Square } from 'lucide-vue-next'

interface Props {
  disabled?: boolean
  isWorking?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  isWorking: false,
})

const emit = defineEmits<{
  send: [content: string]
  abort: []
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !props.disabled && !props.isWorking
})

function handleSend() {
  if (!canSend.value) return
  const content = inputText.value.trim()
  inputText.value = ''
  // 重置 textarea 高度
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
  emit('send', content)
}

function handleAbort() {
  emit('abort')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 自动调整 textarea 高度
function handleInput() {
  if (!textareaRef.value) return
  textareaRef.value.style.height = 'auto'
  const scrollHeight = textareaRef.value.scrollHeight
  // 最大 5 行高度
  textareaRef.value.style.height = Math.min(scrollHeight, 120) + 'px'
}
</script>

<template>
  <div class="border-t p-4">
    <div class="flex items-end gap-2">
      <!-- 输入框 -->
      <textarea
        ref="textareaRef"
        v-model="inputText"
        placeholder="输入您的健身问题..."
        class="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="disabled"
        rows="1"
        style="min-height: 38px; max-height: 120px"
        @keydown="handleKeydown"
        @input="handleInput"
      />

      <!-- 停止按钮（工作中） -->
      <Button
        v-if="isWorking"
        type="button"
        variant="destructive"
        size="icon"
        class="shrink-0"
        title="停止生成"
        @click="handleAbort"
      >
        <Square class="h-4 w-4" />
      </Button>

      <!-- 发送按钮 -->
      <Button
        v-else
        type="button"
        size="icon"
        class="shrink-0"
        :disabled="!canSend"
        title="发送消息"
        @click="handleSend"
      >
        <Send class="h-4 w-4" />
      </Button>
    </div>

    <!-- 字符计数 -->
    <p
      v-if="inputText.length > 1800"
      class="mt-1 text-xs text-right"
      :class="inputText.length > 2000 ? 'text-destructive' : 'text-muted-foreground'"
    >
      {{ inputText.length }}/2000
    </p>

    <!-- 免责声明 -->
    <p class="mt-2 text-xs text-muted-foreground text-center">
      AI 建议仅供参考，不能替代专业医疗诊断。如有健康问题请咨询医生。
    </p>
  </div>
</template>
