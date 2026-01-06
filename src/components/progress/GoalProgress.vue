<template>
  <Card>
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base flex items-center gap-2">
          <Target class="h-4 w-4" />
          目标进度
        </CardTitle>
        <Button variant="ghost" size="sm" @click="$emit('add-goal')">
          <Plus class="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <!-- 加载状态 -->
      <div v-if="loading" class="space-y-4">
        <div v-for="i in 2" :key="i" class="animate-pulse">
          <div class="h-4 bg-muted rounded w-1/3 mb-2"></div>
          <div class="h-2 bg-muted rounded w-full mb-1"></div>
          <div class="h-3 bg-muted rounded w-1/4"></div>
        </div>
      </div>

      <!-- 目标列表 -->
      <div v-else-if="goals.length > 0" class="space-y-4">
        <div
          v-for="goal in goals"
          :key="goal.id"
          class="space-y-2 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
          @click="$emit('goal-click', goal)"
        >
          <!-- 目标标题和状态 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <component :is="getGoalIcon(goal.type)" class="h-4 w-4 text-muted-foreground" />
              <span class="font-medium text-sm">{{ goal.name }}</span>
            </div>
            <Badge :variant="getStatusVariant(goal.status)">
              {{ getStatusText(goal.status) }}
            </Badge>
          </div>

          <!-- 进度条 -->
          <div class="space-y-1">
            <Progress :model-value="goal.progress" class="h-2" />
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>{{ formatValue(goal.currentValue, goal.unit) }}</span>
              <span>{{ goal.progress.toFixed(0) }}%</span>
              <span>{{ formatValue(goal.targetValue, goal.unit) }}</span>
            </div>
          </div>

          <!-- 预计完成时间 -->
          <div v-if="goal.targetDate && goal.status === 'active'" class="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock class="h-3 w-3" />
            <span>{{ getEstimatedCompletion(goal) }}</span>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-6">
        <Target class="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p class="text-sm text-muted-foreground mb-3">暂无目标</p>
        <Button variant="outline" size="sm" @click="$emit('add-goal')">
          <Plus class="h-4 w-4 mr-1" />
          添加目标
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Target, Plus, Clock, Scale, Percent, Dumbbell, TrendingUp, Star } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { FitnessGoal } from '@/api/progress'

// ============ Props & Emits ============

interface Props {
  goals: FitnessGoal[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

defineEmits<{
  'add-goal': []
  'goal-click': [goal: FitnessGoal]
}>()

// ============ 方法 ============

/** 获取目标图标 */
function getGoalIcon(type: FitnessGoal['type']) {
  const icons = {
    weight: Scale,
    body_fat: Percent,
    muscle_mass: Dumbbell,
    strength: TrendingUp,
    custom: Star,
  }
  return icons[type] || Target
}

/** 获取状态变体 */
function getStatusVariant(status: FitnessGoal['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<FitnessGoal['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    completed: 'secondary',
    abandoned: 'destructive',
  }
  return variants[status] || 'secondary'
}

/** 获取状态文本 */
function getStatusText(status: FitnessGoal['status']): string {
  const texts: Record<FitnessGoal['status'], string> = {
    active: '进行中',
    completed: '已完成',
    abandoned: '已放弃',
  }
  return texts[status] || status
}

/** 格式化数值 */
function formatValue(value: number, unit: string): string {
  if (unit === '%') {
    return `${value.toFixed(1)}%`
  }
  if (unit === 'kg') {
    return `${value.toFixed(1)}kg`
  }
  return `${value}${unit}`
}

/** 获取预计完成时间 */
function getEstimatedCompletion(goal: FitnessGoal): string {
  if (!goal.targetDate) return ''
  
  const targetDate = new Date(goal.targetDate)
  const now = new Date()
  const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return '已超期'
  } else if (diffDays === 0) {
    return '今天截止'
  } else if (diffDays === 1) {
    return '明天截止'
  } else if (diffDays <= 7) {
    return `${diffDays}天后截止`
  } else if (diffDays <= 30) {
    const weeks = Math.ceil(diffDays / 7)
    return `约${weeks}周后截止`
  } else {
    const months = Math.ceil(diffDays / 30)
    return `约${months}个月后截止`
  }
}
</script>
