<script setup lang="ts">
/**
 * AI 对话页面 — 基于 YuzhenFork Studio WebSocket 协议
 *
 * 功能：
 * - WebSocket 实时对话
 * - 会话列表（切换/新建/删除）
 * - 流式消息 + 工具调用 + 训练计划渲染
 * - 断线重连
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import MessageStream from '@/components/chat/MessageStream.vue'
import ChatInput from '@/components/chat/ChatInput.vue'
import SkillProgress from '@/components/chat/SkillProgress.vue'
import ApprovalDialog from '@/components/chat/ApprovalDialog.vue'
import { useYuzhenChat } from '@/composables/useYuzhenChat'
import type { ToolCallInfo } from '@/composables/useYuzhenChat'
import * as sessionApi from '@/api/yuzhenfork'
import type { SessionListItem } from '@/api/yuzhenfork'
import { Home, Plus, Wifi, WifiOff, RefreshCw, MessageSquare, Trash2, Menu } from 'lucide-vue-next'

const router = useRouter()

// === WebSocket 对话 ===
const {
  messages,
  session,
  connectionState,
  isConnected,
  isWorking,
  isStreaming,
  streamingContent,
  error,
  connect,
  disconnect,
  sendMessage,
  abort,
} = useYuzhenChat()

// === 本地状态 ===
const currentSessionId = ref<string | null>(null)
const isInitializing = ref(true)
const initError = ref<string | null>(null)
const sessionList = ref<SessionListItem[]>([])
const showSessionList = ref(false)

// HITL 审批状态
const pendingApproval = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    const msg = messages.value[i]
    if (msg.toolCalls) {
      const pending = msg.toolCalls.find(
        (tc: ToolCallInfo) => tc.confirmationRequired && tc.confirmation
      )
      if (pending) return pending
    }
  }
  return null
})

const approvalVisible = computed(() => !!pendingApproval.value)

// SkillProgress 适配
const skillPhase = computed(() => {
  if (!isWorking.value) return 'idle'
  if (isStreaming.value) return 'generating'
  return 'thinking'
})

// 最后一条消息的状态（用于显示继续/重试按钮）
const lastMessage = computed(() => {
  if (messages.value.length === 0) return null
  return messages.value[messages.value.length - 1]
})

// 是否显示重试按钮（最后一条是错误或中断）
const showRetryButton = computed(() => {
  if (isWorking.value) return false
  if (!lastMessage.value) return false
  // 如果有错误
  if (error.value) return true
  // 如果最后一条是用户消息（AI 没回复就断了）
  if (lastMessage.value.role === 'user') return true
  return false
})

// 是否显示继续按钮（AI 回复被中断）
const showContinueButton = computed(() => {
  if (isWorking.value) return false
  if (!lastMessage.value) return false
  // 如果最后一条 AI 消息内容很短（可能被中断）
  if (lastMessage.value.role === 'assistant' && lastMessage.value.content.length < 20) return true
  return false
})

// 连接状态文本
const connectionLabel = computed(() => {
  switch (connectionState.value) {
    case 'connected': return '已连接'
    case 'connecting': return '连接中...'
    case 'reconnecting': return '重连中...'
    case 'disconnected': return '未连接'
    default: return ''
  }
})

// === 方法 ===

async function initSession() {
  isInitializing.value = true
  initError.value = null

  try {
    const sessions = await sessionApi.listSessions()
    sessionList.value = sessions

    if (sessions.length > 0) {
      const latest = sessions[0]
      currentSessionId.value = latest.id
      connect(latest.id)
    } else {
      await createNewSession()
    }
  } catch (err: any) {
    initError.value = err?.message || '初始化会话失败'
  } finally {
    isInitializing.value = false
  }
}

async function createNewSession() {
  disconnect()
  currentSessionId.value = null

  try {
    const newSession = await sessionApi.createSession({
      title: '健身对话',
      kind: 'standalone',
      sessionMode: 'chat',
      sessionConfig: {
        permissionMode: 'allow',
      },
    })
    currentSessionId.value = newSession.id
    connect(newSession.id)

    // 刷新列表
    sessionList.value = await sessionApi.listSessions()
  } catch (err: any) {
    initError.value = err?.message || '创建会话失败'
  }
}

async function switchSession(sessionId: string) {
  if (sessionId === currentSessionId.value) {
    showSessionList.value = false
    return
  }

  disconnect()
  currentSessionId.value = sessionId
  connect(sessionId)
  showSessionList.value = false
}

async function deleteSessionById(sessionId: string) {
  try {
    await sessionApi.deleteSession(sessionId)
    sessionList.value = sessionList.value.filter(s => s.id !== sessionId)

    // 如果删除的是当前会话，切换到最新的或创建新的
    if (sessionId === currentSessionId.value) {
      if (sessionList.value.length > 0) {
        await switchSession(sessionList.value[0].id)
      } else {
        await createNewSession()
      }
    }
  } catch {
    // 静默失败
  }
}

function handleSend(content: string) {
  sendMessage(content)
}

function handleAbort() {
  abort()
}

function handleApprovalApprove() {
  if (!currentSessionId.value || !pendingApproval.value) return
  sessionApi.confirmToolDecision(
    currentSessionId.value,
    pendingApproval.value.toolName,
    'approve'
  )
}

function handleApprovalDeny() {
  if (!currentSessionId.value || !pendingApproval.value) return
  sessionApi.confirmToolDecision(
    currentSessionId.value,
    pendingApproval.value.toolName,
    'reject'
  )
}

function goHome() {
  router.push('/')
}

function handleRetry() {
  if (currentSessionId.value) {
    connect(currentSessionId.value)
  } else {
    initSession()
  }
}

// 重试最后一条消息
function handleRetryLastMessage() {
  error.value = null
  if (lastMessage.value?.role === 'user') {
    // 重新发送最后一条用户消息
    sendMessage(lastMessage.value.content)
  }
}

// 继续生成（发送空消息让 AI 继续）
function handleContinue() {
  sendMessage('继续')
}

function formatSessionTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// === 生命周期 ===

onMounted(() => {
  initSession()
})

watch(error, (val) => {
  // 连接相关错误不自动消失（需要用户手动重试）
  if (val && !val.includes('连接') && !val.includes('未连接') && !val.includes('断开')) {
    setTimeout(() => { error.value = null }, 5000)
  }
})
</script>

<template>
  <div class="flex h-screen flex-col bg-background">
    <!-- 顶部导航栏 -->
    <div class="flex h-14 items-center justify-between border-b px-4">
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon" title="返回首页" @click="goHome">
          <Home class="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" title="会话列表" @click="showSessionList = !showSessionList">
          <Menu class="h-5 w-5" />
        </Button>
        <h1 class="text-base font-semibold truncate max-w-[140px]">
          {{ session?.title || '智能健身顾问' }}
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <Badge :variant="isConnected ? 'default' : 'secondary'" class="gap-1 text-xs">
          <Wifi v-if="isConnected" class="h-3 w-3" />
          <WifiOff v-else class="h-3 w-3" />
          {{ connectionLabel }}
        </Badge>
        <Button variant="ghost" size="icon" title="新建对话" @click="createNewSession">
          <Plus class="h-5 w-5" />
        </Button>
      </div>
    </div>

    <!-- 会话列表抽屉 -->
    <div
      v-if="showSessionList"
      class="absolute inset-0 z-50 flex"
      @click.self="showSessionList = false"
    >
      <div class="w-72 h-full bg-background border-r shadow-lg overflow-y-auto">
        <div class="p-3 border-b flex items-center justify-between">
          <span class="text-sm font-medium">对话历史</span>
          <Button variant="ghost" size="sm" class="h-7 gap-1" @click="createNewSession">
            <Plus class="h-3.5 w-3.5" />
            新建
          </Button>
        </div>
        <div class="divide-y">
          <div
            v-for="s in sessionList"
            :key="s.id"
            class="group flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors"
            :class="{ 'bg-muted': s.id === currentSessionId }"
            @click="switchSession(s.id)"
          >
            <MessageSquare class="h-4 w-4 text-muted-foreground shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="text-sm truncate">{{ s.title || '未命名对话' }}</div>
              <div class="text-xs text-muted-foreground">
                {{ formatSessionTime(s.lastModified || s.createdAt) }} · {{ s.messageCount }}条
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
              @click.stop="deleteSessionById(s.id)"
            >
              <Trash2 class="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
          <div v-if="sessionList.length === 0" class="p-4 text-center text-sm text-muted-foreground">
            暂无对话记录
          </div>
        </div>
      </div>
      <!-- 遮罩 -->
      <div class="flex-1 bg-black/20" @click="showSessionList = false" />
    </div>

    <!-- 错误提示 -->
    <div v-if="error || initError" class="px-4 pt-3">
      <div class="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
        <span class="flex-1">{{ error || initError }}</span>
        <Button variant="ghost" size="sm" class="h-7 gap-1" @click="handleRetry">
          <RefreshCw class="h-3.5 w-3.5" />
          重试
        </Button>
      </div>
    </div>

    <!-- 初始化加载 -->
    <div v-if="isInitializing" class="flex-1 flex items-center justify-center">
      <div class="text-center space-y-2">
        <div class="h-8 w-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p class="text-sm text-muted-foreground">正在连接 AI 顾问...</p>
      </div>
    </div>

    <!-- 消息流 -->
    <MessageStream
      v-else
      :messages="messages"
      :is-streaming="isStreaming"
      :streaming-content="streamingContent"
      @quick-send="handleSend"
    />

    <!-- Skill 执行进度 -->
    <div v-if="isWorking && !isInitializing" class="px-4 pb-2">
      <SkillProgress
        :current-phase="skillPhase"
        :skill-name="session?.agentId || ''"
        :current-tool="''"
        :tools-completed="0"
        :tools-total="0"
      />
    </div>

    <!-- 继续/重试按钮 -->
    <div v-if="showRetryButton || showContinueButton" class="px-4 pb-2 flex gap-2">
      <Button
        v-if="showRetryButton"
        variant="outline"
        size="sm"
        class="gap-1.5"
        @click="handleRetryLastMessage"
      >
        <RefreshCw class="h-3.5 w-3.5" />
        重试
      </Button>
      <Button
        v-if="showContinueButton"
        variant="outline"
        size="sm"
        class="gap-1.5"
        @click="handleContinue"
      >
        继续生成
      </Button>
    </div>

    <!-- 输入框 -->
    <ChatInput
      v-if="!isInitializing"
      :disabled="!isConnected"
      :is-working="isWorking"
      @send="handleSend"
      @abort="handleAbort"
    />

    <!-- HITL 安全确认弹窗 -->
    <ApprovalDialog
      :visible="approvalVisible"
      :reason="pendingApproval?.confirmation?.reason || ''"
      :skill-name="pendingApproval?.toolName || ''"
      :suggestion="pendingApproval?.confirmation?.suggestion"
      @approve="handleApprovalApprove"
      @deny="handleApprovalDeny"
      @update:visible="() => {}"
    />
  </div>
</template>
