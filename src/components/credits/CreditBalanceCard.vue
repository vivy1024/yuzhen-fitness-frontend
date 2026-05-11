<script setup lang="ts">
/**
 * 积分余额卡片组件
 * 支持大卡片和紧凑模式（compact prop）
 */
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Coins, Calendar } from 'lucide-vue-next'
import type { CreditBalance } from '@/api/credits'

const props = withDefaults(defineProps<{
  balance: CreditBalance | null
  compact?: boolean
}>(), {
  compact: false,
})

/** 月度使用进度 (0-100) */
const usagePercent = computed(() => {
  if (!props.balance) return 0
  const limit = parseFloat(props.balance.monthly_limit)
  if (limit === 0) return 0
  const used = parseFloat(props.balance.used_this_month)
  return Math.min(100, Math.round((used / limit) * 100))
})

/** 格式化数字 */
function formatCredits(value: string | undefined): string {
  if (!value) return '0.00'
  return parseFloat(value).toFixed(2)
}

/** 等级中文名 */
const tierLabel = computed(() => {
  const map: Record<string, string> = {
    free: '免费用户',
    warmheart: '暖心会员',
    energy: '能量会员',
  }
  return map[props.balance?.tier ?? 'free'] ?? '免费用户'
})

/** 等级 Badge 样式 */
const tierVariant = computed(() => {
  if (props.balance?.tier === 'energy') return 'default'
  if (props.balance?.tier === 'warmheart') return 'secondary'
  return 'outline'
})

/** 下次重置日期（每月1日） */
const nextResetDate = computed(() => {
  const now = new Date()
  const year = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear()
  const month = now.getMonth() === 11 ? 0 : now.getMonth() + 1
  const resetDate = new Date(year, month, 1)
  return `${resetDate.getMonth() + 1}月1日`
})
</script>

<template>
  <!-- 紧凑模式：用于对话页面顶部 -->
  <div v-if="compact && balance" class="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg">
    <Coins class="h-4 w-4 text-amber-500 shrink-0" />
    <div class="flex-1 min-w-0">
      <Progress :model-value="usagePercent" class="h-1.5" />
    </div>
    <span class="text-xs text-muted-foreground whitespace-nowrap">
      剩余 {{ formatCredits(balance.monthly_remaining) }}
    </span>
    <Badge :variant="tierVariant" class="text-[10px] px-1.5 py-0">
      {{ tierLabel }}
    </Badge>
  </div>

  <!-- 大卡片模式 -->
  <Card v-else-if="balance" class="overflow-hidden">
    <CardHeader class="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 pb-3">
      <div class="flex items-center justify-between">
        <CardTitle class="text-base flex items-center gap-2">
          <Coins class="h-5 w-5 text-amber-500" />
          积分余额
        </CardTitle>
        <Badge :variant="tierVariant">
          {{ tierLabel }}
        </Badge>
      </div>
    </CardHeader>
    <CardContent class="pt-4 space-y-4">
      <!-- 可用积分 -->
      <div class="text-center">
        <p class="text-3xl font-bold text-foreground">
          {{ formatCredits(balance.total_available) }}
        </p>
        <p class="text-sm text-muted-foreground mt-1">可用积分</p>
      </div>

      <!-- 积分明细 -->
      <div class="grid grid-cols-2 gap-3 text-center">
        <div class="bg-muted/50 rounded-lg p-2">
          <p class="text-sm font-medium">{{ formatCredits(balance.balance) }}</p>
          <p class="text-xs text-muted-foreground">基础积分</p>
        </div>
        <div class="bg-muted/50 rounded-lg p-2">
          <p class="text-sm font-medium">{{ formatCredits(balance.bonus_balance) }}</p>
          <p class="text-xs text-muted-foreground">奖励积分</p>
        </div>
      </div>

      <!-- 月度使用进度 -->
      <div class="space-y-2">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">本月已用</span>
          <span class="font-medium">
            {{ formatCredits(balance.used_this_month) }} / {{ formatCredits(balance.monthly_limit) }}
          </span>
        </div>
        <Progress :model-value="usagePercent" class="h-2" />
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>剩余 {{ formatCredits(balance.monthly_remaining) }}</span>
          <span class="flex items-center gap-1">
            <Calendar class="h-3 w-3" />
            {{ nextResetDate }}重置
          </span>
        </div>
      </div>
    </CardContent>
  </Card>

  <!-- 加载占位 -->
  <Card v-else>
    <CardContent class="py-8 text-center text-muted-foreground">
      <Coins class="h-8 w-8 mx-auto mb-2 animate-pulse" />
      <p class="text-sm">加载积分信息...</p>
    </CardContent>
  </Card>
</template>
