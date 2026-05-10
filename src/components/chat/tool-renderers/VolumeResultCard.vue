<script setup lang="ts">
/**
 * 训练容量结果卡片
 * 展示 MEV/MAV/MRV + 推荐容量
 */
import { BarChart3 } from 'lucide-vue-next'

interface Props {
  result: {
    muscleGroup?: string
    muscle_group?: string
    mev?: number
    mav?: number
    mrv?: number
    recommended?: number
    frequency?: { min?: number; max?: number }
    recoveryDays?: number
    recovery_days?: number
    setsPerSession?: { min?: number; max?: number }
    sets_per_session?: { min?: number; max?: number }
    notes?: string
  }
}

const props = defineProps<Props>()

const muscleGroup = props.result.muscleGroup || props.result.muscle_group || '未知肌群'
const frequency = props.result.frequency
const setsPerSession = props.result.setsPerSession || props.result.sets_per_session
const recoveryDays = props.result.recoveryDays || props.result.recovery_days
</script>

<template>
  <div class="rounded-lg border border-border bg-card p-3 space-y-3">
    <!-- 标题 -->
    <div class="flex items-center gap-2">
      <BarChart3 class="h-4 w-4 text-purple-500" />
      <span class="text-sm font-medium">{{ muscleGroup }} 训练容量</span>
    </div>

    <!-- MEV/MAV/MRV 可视化 -->
    <div class="relative h-8 rounded-full bg-muted overflow-hidden">
      <!-- MRV 区域（红色警告） -->
      <div class="absolute inset-y-0 left-0 bg-red-100 rounded-full" style="width: 100%" />
      <!-- MAV 区域（绿色最佳） -->
      <div
        v-if="result.mrv"
        class="absolute inset-y-0 left-0 bg-green-100 rounded-full"
        :style="{ width: ((result.mav || 0) / result.mrv * 100) + '%' }"
      />
      <!-- MEV 区域（黄色最低） -->
      <div
        v-if="result.mrv"
        class="absolute inset-y-0 left-0 bg-amber-100 rounded-full"
        :style="{ width: ((result.mev || 0) / result.mrv * 100) + '%' }"
      />
      <!-- 推荐位置标记 -->
      <div
        v-if="result.mrv && result.recommended"
        class="absolute inset-y-0 w-0.5 bg-primary"
        :style="{ left: (result.recommended / result.mrv * 100) + '%' }"
      />
      <!-- 标签 -->
      <div class="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-medium">
        <span class="text-amber-700">MEV {{ result.mev }}</span>
        <span class="text-green-700">MAV {{ result.mav }}</span>
        <span class="text-red-700">MRV {{ result.mrv }}</span>
      </div>
    </div>

    <!-- 推荐值 -->
    <div class="text-center">
      <span class="text-xs text-muted-foreground">推荐: </span>
      <span class="text-sm font-bold text-primary">{{ result.recommended }} 组/周</span>
    </div>

    <!-- 详细参数 -->
    <div class="grid grid-cols-3 gap-2 text-xs text-center">
      <div v-if="frequency">
        <div class="text-muted-foreground">频率</div>
        <div class="font-medium">{{ frequency.min }}-{{ frequency.max }}次/周</div>
      </div>
      <div v-if="setsPerSession">
        <div class="text-muted-foreground">每次</div>
        <div class="font-medium">{{ setsPerSession.min }}-{{ setsPerSession.max }}组</div>
      </div>
      <div v-if="recoveryDays">
        <div class="text-muted-foreground">恢复</div>
        <div class="font-medium">{{ recoveryDays }}天</div>
      </div>
    </div>

    <!-- 备注 -->
    <div v-if="result.notes" class="text-xs text-muted-foreground border-t border-border/50 pt-2">
      {{ result.notes }}
    </div>
  </div>
</template>
