<template>
  <Sheet v-model:open="isOpen">
    <SheetContent side="left" class="w-80 p-0">
      <div class="flex flex-col h-full">
        <!-- Header -->
        <SheetHeader class="px-4 py-4 border-b">
          <SheetTitle class="text-lg font-semibold">话题列表</SheetTitle>
          <SheetDescription class="text-sm text-gray-500">
            管理你的对话话题
          </SheetDescription>
        </SheetHeader>

        <!-- Topics List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <!-- Empty State -->
          <div v-if="topics.length === 0" class="flex flex-col items-center justify-center h-full text-center py-8">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p class="text-sm text-gray-600">暂无话题</p>
            <p class="text-xs text-gray-400 mt-1">点击下方按钮创建新话题</p>
          </div>

          <!-- Topic Items -->
          <div
            v-for="topic in topics"
            :key="topic.id"
            @click="selectTopic(topic.id)"
            :class="[
              'group relative p-3 rounded-lg border cursor-pointer transition-all',
              currentTopicId === topic.id
                ? 'bg-purple-50 border-purple-300 shadow-sm'
                : 'bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
            ]"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-900 truncate">
                  {{ topic.name }}
                </h3>
                <p v-if="topic.lastMessage" class="text-xs text-gray-500 truncate mt-1">
                  {{ topic.lastMessage }}
                </p>
                <div class="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" class="text-xs">
                    {{ topic.messageCount }} 条消息
                  </Badge>
                  <span class="text-xs text-gray-400">
                    {{ formatDate(topic.updatedAt) }}
                  </span>
                </div>
              </div>

              <!-- Delete Button -->
              <button
                @click.stop="handleDelete(topic.id)"
                class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                title="删除话题"
              >
                <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer - Create Button -->
        <div class="p-4 border-t">
          <Button
            @click="handleCreate"
            class="w-full"
            :disabled="loading"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            创建新话题
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface Topic {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  messageCount: number
  lastMessage?: string
}

interface Props {
  visible: boolean
  topics: Topic[]
  currentTopicId: string | null
  loading?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'select-topic', topicId: string): void
  (e: 'create-topic'): void
  (e: 'delete-topic', topicId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<Emits>()

// 双向绑定visible
const isOpen = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 选择话题
function selectTopic(topicId: string) {
  emit('select-topic', topicId)
  emit('update:visible', false) // 选择后关闭侧边栏
}

// 创建话题
function handleCreate() {
  emit('create-topic')
}

// 删除话题
function handleDelete(topicId: string) {
  if (confirm('确定要删除这个话题吗？删除后无法恢复。')) {
    emit('delete-topic', topicId)
  }
}

// 格式化日期
function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}
</script>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
