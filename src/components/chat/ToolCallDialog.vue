<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-vue-next'
import type { ToolCall } from './ToolCallTimeline.vue'

interface Props {
  open: boolean
  toolCalls: ToolCall[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 展开/折叠状态
const expandedTools = ref<Set<string>>(new Set())

/**
 * 切换工具详情的展开/折叠状态
 */
const toggleExpand = (toolId: string) => {
  if (expandedTools.value.has(toolId)) {
    expandedTools.value.delete(toolId)
  } else {
    expandedTools.value.add(toolId)
  }
}

/**
 * 判断工具是否展开
 */
const isExpanded = (toolId: string) => {
  return expandedTools.value.has(toolId)
}

/**
 * 获取工具调用的状态图标
 */
const getStatusIcon = (status: ToolCall['status']) => {
  switch (status) {
    case 'success':
      return CheckCircle2
    case 'error':
      return XCircle
    case 'running':
      return Loader2
    case 'pending':
      return Clock
    default:
      return Clock
  }
}

/**
 * 获取工具调用的状态颜色类名
 */
const getStatusColor = (status: ToolCall['status']) => {
  switch (status) {
    case 'success':
      return 'text-green-600'
    case 'error':
      return 'text-destructive'
    case 'running':
      return 'text-blue-600'
    case 'pending':
      return 'text-muted-foreground'
    default:
      return 'text-muted-foreground'
  }
}

/**
 * 获取工具调用的状态文本
 */
const getStatusText = (status: ToolCall['status']) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'error':
      return '失败'
    case 'running':
      return '执行中'
    case 'pending':
      return '等待中'
    default:
      return '未知'
  }
}

/**
 * 格式化执行时间
 */
const formatDuration = (duration?: number) => {
  if (!duration) return '-'
  if (duration < 1000) return `${duration}ms`
  return `${(duration / 1000).toFixed(2)}s`
}

/**
 * 计算工具调用的执行时长
 */
const getToolDuration = (tool: ToolCall) => {
  if (tool.duration) return tool.duration
  if (tool.endTime && tool.startTime) {
    return tool.endTime - tool.startTime
  }
  return undefined
}

/**
 * 格式化时间戳
 */
const formatTimestamp = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 格式化JSON数据
 */
const formatJSON = (data: any) => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>专业工具调用详情</DialogTitle>
        <DialogDescription>
          查看AI使用的专业分析工具的完整执行记录
        </DialogDescription>
      </DialogHeader>

      <!-- 工具列表 - 可滚动区域 -->
      <div class="flex-1 overflow-y-auto space-y-3 pr-2">
        <div
          v-for="tool in toolCalls"
          :key="tool.id"
          class="rounded-lg border bg-card"
        >
          <!-- 工具头部 - 可点击展开/折叠 -->
          <button
            class="w-full flex items-start gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
            @click="toggleExpand(tool.id)"
          >
            <!-- 展开/折叠图标 -->
            <component
              :is="isExpanded(tool.id) ? ChevronDown : ChevronRight"
              class="h-5 w-5 shrink-0 text-muted-foreground mt-0.5"
            />

            <!-- 状态图标 -->
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
              <component
                :is="getStatusIcon(tool.status)"
                :class="[
                  'h-4 w-4',
                  getStatusColor(tool.status),
                  tool.status === 'running' && 'animate-spin',
                ]"
              />
            </div>

            <!-- 工具信息 -->
            <div class="flex-1 space-y-1.5">
              <!-- 工具名称和状态 -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-sm">
                    {{ tool.displayName || tool.name }}
                  </span>
                  <Badge variant="outline" class="text-xs">
                    {{ getStatusText(tool.status) }}
                  </Badge>
                </div>
                <span class="text-xs text-muted-foreground">
                  {{ formatDuration(getToolDuration(tool)) }}
                </span>
              </div>

              <!-- 数据来源 -->
              <div v-if="tool.dataSource" class="text-xs text-muted-foreground">
                数据来源: {{ tool.dataSource }}
              </div>

              <!-- 时间信息 -->
              <div class="text-xs text-muted-foreground">
                开始时间: {{ formatTimestamp(tool.startTime) }}
                <span v-if="tool.endTime">
                  | 结束时间: {{ formatTimestamp(tool.endTime) }}
                </span>
              </div>
            </div>
          </button>

          <!-- 工具详情 - 展开时显示 -->
          <div v-if="isExpanded(tool.id)" class="border-t px-4 py-3 space-y-3">
            <!-- 参数 -->
            <div v-if="tool.parameters && Object.keys(tool.parameters).length > 0">
              <div class="text-sm font-medium mb-2">调用参数:</div>
              <pre class="text-xs bg-muted rounded-md p-3 overflow-x-auto">{{ formatJSON(tool.parameters) }}</pre>
            </div>

            <!-- 结果 -->
            <div v-if="tool.status === 'success' && tool.result">
              <div class="text-sm font-medium mb-2">执行结果:</div>
              <pre class="text-xs bg-muted rounded-md p-3 overflow-x-auto max-h-60">{{ formatJSON(tool.result) }}</pre>
            </div>

            <!-- 错误信息 -->
            <div v-if="tool.status === 'error' && tool.error">
              <div class="text-sm font-medium mb-2 text-destructive">错误信息:</div>
              <div class="text-xs bg-destructive/10 text-destructive rounded-md p-3">
                {{ tool.error }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部统计 -->
      <div class="border-t pt-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>共 {{ toolCalls.length }} 个工具调用</span>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-1">
            <CheckCircle2 class="h-4 w-4 text-green-600" />
            成功: {{ toolCalls.filter(t => t.status === 'success').length }}
          </span>
          <span class="flex items-center gap-1">
            <XCircle class="h-4 w-4 text-destructive" />
            失败: {{ toolCalls.filter(t => t.status === 'error').length }}
          </span>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
