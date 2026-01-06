<script setup lang="ts">
/**
 * 统计卡片组件
 * 显示单个指标值，支持趋势图和状态颜色
 */
import { computed } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  title: string
  value: number | string
  unit?: string
  format?: 'number' | 'percent' | 'duration' | 'bytes'
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  status?: 'success' | 'warning' | 'error' | 'info'
  icon?: any
}>(), {
  unit: '',
  format: 'number',
  status: 'info'
})

const formattedValue = computed(() => {
  if (typeof props.value === 'string') return props.value
  
  const v = props.value
  switch (props.format) {
    case 'percent':
      return `${(v * 100).toFixed(1)}%`
    case 'duration':
      if (v >= 60) return `${(v / 60).toFixed(1)}m`
      if (v >= 1) return `${v.toFixed(2)}s`
      return `${(v * 1000).toFixed(0)}ms`
    case 'bytes':
      if (v >= 1073741824) return `${(v / 1073741824).toFixed(1)}GB`
      if (v >= 1048576) return `${(v / 1048576).toFixed(1)}MB`
      if (v >= 1024) return `${(v / 1024).toFixed(1)}KB`
      return `${v}B`
    default:
      return v >= 10000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(v < 10 ? 2 : 0)
  }
})

const statusColors = {
  success: 'text-green-500',
  warning: 'text-amber-500',
  error: 'text-red-500',
  info: 'text-blue-500'
}

const trendColors = {
  up: 'text-green-500',
  down: 'text-red-500',
  stable: 'text-gray-500'
}
</script>

<template>
  <Card>
    <CardContent class="p-4">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground">{{ title }}</span>
        <component v-if="icon" :is="icon" class="h-4 w-4 text-muted-foreground" />
      </div>
      <div class="mt-2 flex items-baseline gap-2">
        <span class="text-2xl font-bold" :class="statusColors[status]">
          {{ formattedValue }}
        </span>
        <span v-if="unit" class="text-sm text-muted-foreground">{{ unit }}</span>
      </div>
      <div v-if="trend" class="mt-1 flex items-center gap-1 text-xs" :class="trendColors[trend]">
        <TrendingUp v-if="trend === 'up'" class="h-3 w-3" />
        <TrendingDown v-if="trend === 'down'" class="h-3 w-3" />
        <Minus v-if="trend === 'stable'" class="h-3 w-3" />
        <span>{{ trendValue }}</span>
      </div>
    </CardContent>
  </Card>
</template>
