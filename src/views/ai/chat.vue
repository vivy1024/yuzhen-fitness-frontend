<script setup lang="ts">
/**
 * AI 对话页面 — 基于 YuzhenFork Studio WebSocket 协议
 * 
 * 使用 useYuzhenChat composable 管理 WebSocket 连接
 * 使用 yuzhenfork session API 管理会话生命周期
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
import { Home, Plus, Wifi, WifiOff, RefreshCw } from 'lucide-vue-next'

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
} = useYuzhenChat(sessionApi.YUZHENFORK_BASE.replace(/^http/, 'ws'))

// === 本地状态 ===
const currentSessionId = ref<string | null>(null)
const isInitializing = ref(true)
const initError = ref<string | null>(null)

// HITL 审批状态（从 toolCalls 中提取需要确认的）
const pendingApproval = computed(() => {
  // 遍历最新消息的 toolCalls，找到需要确认的
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

// SkillProgress 适配（从 isWorking 状态推断阶段）
const skillPhase = computed(() => {
  if (!isWorking.value) return 'idle'
  if (isStreaming.value) return 'generating'
  return 'thinking'
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
    // 获取已有会话列表
    const sessions = await sessionApi.listSessions()

    if (sessions.length > 0) {
      // 连接最新的会话
      const latest = sessions[0]
      currentSessionId.value = latest.id
      connect(latest.id)
    } else {
      // 创建新会话
      const newSession = await sessionApi.createSession({
        title: '健身对话',
        kind: 'standalone',
        sessionMode: 'chat',
        sessionConfig: {
          permissionMode: 'ask',
        },
      })
      currentSessionId.value = newSession.id
      connect(newSession.id)
    }
  } catch (err: any) {
    initError.value = err?.message || '初始化会话失败'
  } finally {
    isInitializing.value = false
  }
}

async function handleNewChat() {
  disconnect()
  currentSessionId.value = null

  try {
    const newSession = await sessionApi.createSession({
      title: '健身对话',
      kind: 'standalone',
      sessionMode: 'chat',
      sessionConfig: {
        permissionMode: 'ask',
      },
    })
    currentSessionId.value = newSession.id
    connect(newSession.id)
  } catch (err: any) {
    initError.value = err?.message || '创建会话失败'
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

// === 生命周期 ===

onMounted(() => {
  initSession()
})

// 监听错误，自动清除
watch(error, (val) => {
  if (val) {
    setTimeout(() => {
      error.value = null
    }, 5000)
  }
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
          title="返回首页"
          @click="goHome"
        >
          <Home class="h-5 w-5" />
        </Button>
        <h1 class="text-lg font-semibold truncate max-w-[180px]">
          {{ session?.title || '智能健身顾问' }}
        </h1>
      </div>

      <div class="flex items-center gap-2">
        <!-- 连接状态 -->
        <Badge
          :variant="isConnected ? 'default' : 'secondary'"
          class="gap-1 text-xs"
        >
          <Wifi v-if="isConnected" class="h-3 w-3" />
          <WifiOff v-else class="h-3 w-3" />
          {{ connectionLabel }}
        </Badge>

        <!-- 新建对话 -->
        <Button
          variant="ghost"
          size="icon"
          title="新建对话"
          @click="handleNewChat"
        >
          <Plus class="h-5 w-5" />
        </Button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error || initError" class="px-4 pt-3">
      <div class="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
        <span class="flex-1">{{ error || initError }}</span>
        <Button
          variant="ghost"
          size="sm"
          class="h-7 gap-1"
          @click="handleRetry"
        >
          <RefreshCw class="h-3.5 w-3.5" />
          重试
        </Button>
      </div>
    </div>

    <!-- 初始化加载 -->
    <div v-if="isInitializing" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p class="text-sm text-muted-foreground">正在连接...</p>
      </div>
    </div>

    <!-- 消息流 -->
    <MessageStream
      v-else
      :messages="messages"
      :is-streaming="isStreaming"
      :streaming-content="streamingContent"
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
