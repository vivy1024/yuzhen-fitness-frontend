<script setup lang="ts">
/**
 * 对话监控页面
 * 从 yuzhenfork API 获取 session 列表，展示对话状态
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MessageSquare, RefreshCw, ChevronDown, ChevronUp } from 'lucide-vue-next'

const router = useRouter()

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

interface ChatSession {
  id: string
  title: string
  messageCount: number
  model: string
  lastActive: string
  messages?: ChatMessage[]
}

const loading = ref(true)
const sessions = ref<ChatSession[]>([])
const expandedId = ref<string | null>(null)
const loadingMessages = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  await loadSessions()
})

async function loadSessions() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch('http://localhost:4567/api/sessions')
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    const data = await res.json()
    
    // 适配 yuzhenfork API 响应格式
    if (Array.isArray(data)) {
      sessions.value = data.map((s: any) => ({
        id: s.id || s.session_id,
        title: s.title || s.name || `会话 ${s.id}`,
        messageCount: s.message_count || s.messages?.length || 0,
        model: s.model || s.current_model || '未知',
        lastActive: s.last_active || s.updated_at || s.created_at || ''
      }))
    } else if (data.sessions) {
      sessions.value = data.sessions.map((s: any) => ({
        id: s.id || s.session_id,
        title: s.title || s.name || `会话 ${s.id}`,
        messageCount: s.message_count || s.messages?.length || 0,
        model: s.model || s.current_model || '未知',
        lastActive: s.last_active || s.updated_at || s.created_at || ''
      }))
    }
  } catch (e: any) {
    errorMsg.value = `无法连接 yuzhenfork API: ${e.message}`
    // 使用 fallback mock 数据方便开发
    sessions.value = [
      {
        id: 'mock-1',
        title: '健身计划咨询',
        messageCount: 12,
        model: 'gpt-4o',
        lastActive: new Date().toISOString()
      },
      {
        id: 'mock-2',
        title: '饮食建议',
        messageCount: 8,
        model: 'deepseek-chat',
        lastActive: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'mock-3',
        title: '训练动作纠正',
        messageCount: 5,
        model: 'gpt-4o-mini',
        lastActive: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  } finally {
    loading.value = false
  }
}

async function toggleExpand(session: ChatSession) {
  if (expandedId.value === session.id) {
    expandedId.value = null
    return
  }
  
  expandedId.value = session.id
  
  // 加载消息历史
  if (!session.messages) {
    loadingMessages.value = true
    try {
      const res = await fetch(`http://localhost:4567/api/sessions/${session.id}/messages`)
      if (res.ok) {
        const data = await res.json()
        session.messages = Array.isArray(data) ? data : (data.messages || [])
      } else {
        // Mock fallback
        session.messages = [
          { role: 'user', content: '你好，我想咨询一下健身计划' },
          { role: 'assistant', content: '你好！很高兴为你提供健身建议。请问你的健身目标是什么？' }
        ]
      }
    } catch {
      session.messages = [
        { role: 'system', content: '（无法加载消息历史）' }
      ]
    } finally {
      loadingMessages.value = false
    }
  }
}

function formatTime(isoString: string) {
  if (!isoString) return '未知'
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'user': return 'default'
    case 'assistant': return 'secondary'
    case 'system': return 'outline'
    default: return 'outline'
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'user': return '用户'
    case 'assistant': return 'AI'
    case 'system': return '系统'
    default: return role
  }
}

function goBack() {
  router.push('/admin')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="container flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <div class="flex-1 flex items-center justify-center gap-2">
          <MessageSquare class="h-5 w-5 text-primary" />
          <h1 class="text-lg font-semibold">对话监控</h1>
        </div>
        <Button variant="ghost" size="icon" @click="loadSessions">
          <RefreshCw class="h-4 w-4" />
        </Button>
      </div>
    </header>

    <main class="container px-4 py-6 space-y-4">
      <!-- 错误提示 -->
      <Card v-if="errorMsg" class="border-amber-200 bg-amber-50">
        <CardContent class="p-4">
          <p class="text-sm text-amber-700">{{ errorMsg }}</p>
          <p class="text-xs text-amber-600 mt-1">当前显示 Mock 数据</p>
        </CardContent>
      </Card>

      <!-- 加载状态 -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <RefreshCw class="h-5 w-5 animate-spin text-muted-foreground" />
        <span class="ml-2 text-muted-foreground">加载会话列表...</span>
      </div>

      <!-- 会话列表 -->
      <template v-else>
        <div class="text-sm text-muted-foreground mb-2">
          共 {{ sessions.length }} 个会话
        </div>

        <Card
          v-for="session in sessions"
          :key="session.id"
          class="overflow-hidden"
        >
          <!-- 会话摘要行 -->
          <div
            class="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            @click="toggleExpand(session)"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-sm truncate">{{ session.title }}</span>
                <Badge variant="secondary" class="text-xs shrink-0">
                  {{ session.model }}
                </Badge>
              </div>
              <div class="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{{ session.messageCount }} 条消息</span>
                <span>{{ formatTime(session.lastActive) }}</span>
              </div>
            </div>
            <component
              :is="expandedId === session.id ? ChevronUp : ChevronDown"
              class="h-4 w-4 text-muted-foreground shrink-0"
            />
          </div>

          <!-- 展开的消息历史 -->
          <div
            v-if="expandedId === session.id"
            class="border-t bg-muted/30 p-4 space-y-3"
          >
            <div v-if="loadingMessages" class="flex items-center justify-center py-4">
              <RefreshCw class="h-4 w-4 animate-spin text-muted-foreground" />
              <span class="ml-2 text-sm text-muted-foreground">加载消息...</span>
            </div>
            <template v-else-if="session.messages?.length">
              <div
                v-for="(msg, idx) in session.messages"
                :key="idx"
                class="flex gap-2"
              >
                <Badge :variant="getRoleBadgeVariant(msg.role)" class="shrink-0 h-5">
                  {{ getRoleLabel(msg.role) }}
                </Badge>
                <p class="text-sm text-foreground/80 line-clamp-3">{{ msg.content }}</p>
              </div>
            </template>
            <div v-else class="text-sm text-muted-foreground text-center py-2">
              暂无消息记录
            </div>
          </div>
        </Card>
      </template>
    </main>
  </div>
</template>
