<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-vue-next'

/**
 * 工具调用数据接口
 */
export interface ToolCall {
  id: string
  name: string
  displayName?: string
  status: 'pending' | 'running' | 'success' | 'error'
  startTime: number
  endTime?: number
  duration?: number
  parameters?: Record<string, any>
  result?: any
  error?: string
  dataSource?: string // 数据来源标识
}

interface Props {
  toolCalls: ToolCall[]
}

const props = defineProps<Props>()

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
 * 获取工具调用的状态颜色
 */
const getStatusVariant = (status: ToolCall['status']) => {
  switch (status) {
    case 'success':
      return 'default' // 绿色
    case 'error':
      return 'destructive' // 红色
    case 'running':
      return 'secondary' // 蓝色
    case 'pending':
      return 'outline' // 灰色
    default:
      return 'outline'
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
</script>

<template>
  <div class="space-y-3">
    <!-- 标题 -->
    <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <div class="h-px flex-1 bg-border" />
      <span>专业工具调用记录</span>
      <div class="h-px flex-1 bg-border" />
    </div>

    <!-- 工具调用时间线 -->
    <div class="space-y-2">
      <div
        v-for="(tool, index) in toolCalls"
        :key="tool.id"
        class="relative flex items-start gap-3 rounded-lg border bg-card p-3 text-card-foreground transition-colors hover:bg-accent/50"
      >
        <!-- 时间线连接线 -->
        <div
          v-if="index < toolCalls.length - 1"
          class="absolute left-[18px] top-[36px] h-[calc(100%+8px)] w-px bg-border"
        />

        <!-- 状态图标 -->
        <div class="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
          <component
            :is="getStatusIcon(tool.status)"
            :class="[
              'h-4 w-4',
              tool.status === 'success' && 'text-green-600',
              tool.status === 'error' && 'text-destructive',
              tool.status === 'running' && 'animate-spin text-blue-600',
              tool.status === 'pending' && 'text-muted-foreground',
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
              <Badge :variant="getStatusVariant(tool.status)" class="text-xs">
                {{ getStatusText(tool.status) }}
              </Badge>
            </div>
            <span class="text-xs text-muted-foreground">
              {{ formatDuration(getToolDuration(tool)) }}
            </span>
          </div>

          <!-- 数据来源标识 -->
          <div v-if="tool.dataSource" class="text-xs text-muted-foreground">
            <span class="inline-flex items-center gap-1">
              <span class="h-1 w-1 rounded-full bg-blue-500" />
              {{ tool.dataSource }}
            </span>
          </div>

          <!-- 错误信息 -->
          <div v-if="tool.status === 'error' && tool.error" class="text-xs text-destructive">
            错误: {{ tool.error }}
          </div>
        </div>
      </div>
    </div>

    <!-- 总结信息 -->
    <div class="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
      <span>共调用 {{ toolCalls.length }} 个专业工具</span>
      <span>
        成功: {{ toolCalls.filter(t => t.status === 'success').length }} / 
        失败: {{ toolCalls.filter(t => t.status === 'error').length }}
      </span>
    </div>
  </div>
</template>
