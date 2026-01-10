<template>
  <Sheet v-model:open="isOpen">
    <SheetContent side="left" class="w-80 p-0">
      <div class="flex flex-col h-full">
        <!-- Header with Tabs -->
        <SheetHeader class="px-4 py-4 border-b">
          <SheetTitle class="text-lg font-semibold">对话历史</SheetTitle>
          <SheetDescription class="text-sm text-gray-500">
            查看和管理你的历史对话
          </SheetDescription>
          
          <!-- Tab Buttons -->
          <div class="flex gap-2 mt-3">
            <Button
              :variant="activeTab === 'sessions' ? 'default' : 'outline'"
              size="sm"
              @click="activeTab = 'sessions'"
              class="flex-1"
            >
              会话
            </Button>
            <Button
              :variant="activeTab === 'topics' ? 'default' : 'outline'"
              size="sm"
              @click="activeTab = 'topics'"
              class="flex-1"
            >
              话题
            </Button>
          </div>
        </SheetHeader>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <!-- Loading State -->
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>

          <!-- Sessions Tab -->
          <template v-else-if="activeTab === 'sessions'">
            <!-- Empty State -->
            <div v-if="sessions.length === 0" class="flex flex-col items-center justify-center h-full text-center py-8">
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p class="text-sm text-gray-600">暂无对话记录</p>
              <p class="text-xs text-gray-400 mt-1">开始新对话后会显示在这里</p>
            </div>

            <!-- Session Items -->
            <div
              v-for="session in sessions"
              :key="session.sessionId"
              @click="selectSession(session.sessionId)"
              :class="[
                'group relative p-3 rounded-lg border cursor-pointer transition-all',
                currentSessionId === session.sessionId
                  ? 'bg-purple-50 border-purple-300 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-purple-200 hover:bg-purple-50/50'
              ]"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-medium text-gray-900 truncate">
                    {{ session.title }}
                  </h3>
                  <p v-if="session.lastQuery" class="text-xs text-gray-500 truncate mt-1">
                    {{ session.lastQuery }}
                  </p>
                  <div class="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" class="text-xs">
                      {{ session.messageCount }} 轮对话
                    </Badge>
                    <span class="text-xs text-gray-400">
                      {{ formatDate(session.updatedAt) }}
                    </span>
                  </div>
                </div>

                <!-- Delete Button -->
                <button
                  @click.stop="handleDeleteSession(session.sessionId)"
                  class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  title="删除会话"
                >
                  <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Load More -->
            <div v-if="hasMoreSessions" class="pt-2">
              <Button
                variant="outline"
                size="sm"
                class="w-full"
                @click="loadMoreSessions"
                :disabled="loadingMore"
              >
                {{ loadingMore ? '加载中...' : '加载更多' }}
              </Button>
            </div>
          </template>

          <!-- Topics Tab -->
          <template v-else-if="activeTab === 'topics'">
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
                  @click.stop="handleDeleteTopic(topic.id)"
                  class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  title="删除话题"
                >
                  <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t">
          <Button
            v-if="activeTab === 'topics'"
            @click="handleCreateTopic"
            class="w-full"
            :disabled="loading"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            创建新话题
          </Button>
          <Button
            v-else
            @click="handleNewChat"
            class="w-full"
            :disabled="loading"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            开始新对话
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
/**
 * ChatHistorySidebar - 对话历史侧边栏
 * 
 * 显示用户的历史对话会话和话题列表
 * 支持会话切换、删除等操作
 * 
 * @version 1.0.0
 * @date 2026-01-11
 * @requirements 1.1-1.6 对话历史与上下文管理
 */

import { ref, computed, watch, onMounted } from 'vue'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import * as topicApi from '@/api/topic'
import type { ChatSessionInfo, Topic } from '@/api/topic'

interface Props {
  visible: boolean
  topics: Topic[]
  currentTopicId: string | null
  currentSessionId?: string | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'select-topic', topicId: string): void
  (e: 'select-session', sessionId: string): void
  (e: 'create-topic'): void
  (e: 'delete-topic', topicId: string): void
  (e: 'delete-session', sessionId: string): void
  (e: 'new-chat'): void
}

const props = withDefaults(defineProps<Props>(), {
  currentSessionId: null
})

const emit = defineEmits<Emits>()

// State
const activeTab = ref<'sessions' | 'topics'>('sessions')
const sessions = ref<ChatSessionInfo[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const sessionsOffset = ref(0)
const sessionsTotal = ref(0)
const SESSIONS_LIMIT = 20

// Computed
const isOpen = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const hasMoreSessions = computed(() => {
  return sessions.value.length < sessionsTotal.value
})

// 检查用户是否已登录
const isLoggedIn = computed(() => {
  const token = localStorage.getItem('access_token')
  const userId = localStorage.getItem('current_user_id') || localStorage.getItem('user_id')
  return !!token && !!userId && userId !== 'guest'
})

// Watch
watch(() => props.visible, async (newVal) => {
  if (newVal && isLoggedIn.value) {
    await loadSessions()
  }
})

// Methods
async function loadSessions() {
  if (!isLoggedIn.value) return
  
  try {
    loading.value = true
    sessionsOffset.value = 0
    
    const response = await topicApi.getChatSessions({
      limit: SESSIONS_LIMIT,
      offset: 0
    })
    
    if (response.code === 200 && response.data) {
      sessions.value = response.data.sessions
      sessionsTotal.value = response.data.total
    }
  } catch (err) {
    console.error('加载会话列表失败:', err)
  } finally {
    loading.value = false
  }
}

async function loadMoreSessions() {
  if (!isLoggedIn.value || loadingMore.value) return
  
  try {
    loadingMore.value = true
    sessionsOffset.value += SESSIONS_LIMIT
    
    const response = await topicApi.getChatSessions({
      limit: SESSIONS_LIMIT,
      offset: sessionsOffset.value
    })
    
    if (response.code === 200 && response.data) {
      sessions.value.push(...response.data.sessions)
    }
  } catch (err) {
    console.error('加载更多会话失败:', err)
  } finally {
    loadingMore.value = false
  }
}

function selectSession(sessionId: string) {
  emit('select-session', sessionId)
  emit('update:visible', false)
}

function selectTopic(topicId: string) {
  emit('select-topic', topicId)
  emit('update:visible', false)
}

function handleCreateTopic() {
  emit('create-topic')
}

function handleNewChat() {
  emit('new-chat')
  emit('update:visible', false)
}

async function handleDeleteSession(sessionId: string) {
  if (!confirm('确定要删除这个会话吗？删除后无法恢复。')) return
  
  try {
    const response = await topicApi.deleteSession(sessionId)
    if (response.code === 200) {
      sessions.value = sessions.value.filter(s => s.sessionId !== sessionId)
      sessionsTotal.value--
      emit('delete-session', sessionId)
    }
  } catch (err) {
    console.error('删除会话失败:', err)
  }
}

function handleDeleteTopic(topicId: string) {
  if (confirm('确定要删除这个话题吗？删除后无法恢复。')) {
    emit('delete-topic', topicId)
  }
}

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

// Lifecycle
onMounted(() => {
  if (props.visible && isLoggedIn.value) {
    loadSessions()
  }
})
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
