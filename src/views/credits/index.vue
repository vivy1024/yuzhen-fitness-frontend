<script setup lang="ts">
/**
 * 积分中心页面
 * 展示积分余额、签到、获取方式说明、消耗明细
 */
import { computed, onMounted } from 'vue'
import { useCreditsStore } from '@/stores/credits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import CreditBalanceCard from '@/components/credits/CreditBalanceCard.vue'
import BottomNav from '@/components/layout/BottomNav.vue' // kept for compatibility
import {
  Coins,
  TrendingDown,
  TrendingUp,
  Calendar,
  Gift,
  UserPlus,
  Loader2,
  ChevronLeft,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { showSuccess, showError } from '@/components/ui/toast'

const router = useRouter()
const creditsStore = useCreditsStore()

// 按天分组流水
const groupedTransactions = computed(() => {
  const groups: Record<string, typeof creditsStore.transactions> = {}
  for (const tx of creditsStore.transactions) {
    const date = tx.created_at.split('T')[0] || tx.created_at.split(' ')[0]
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
})

/** 格式化日期标题 */
function formatDateLabel(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return '今天'
  if (dateStr === yesterday) return '昨天'
  const [, month, day] = dateStr.split('-')
  return `${parseInt(month)}月${parseInt(day)}日`
}

/** 格式化时间 */
function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

/** 格式化金额 */
function formatAmount(amount: string): string {
  const num = parseFloat(amount)
  if (num > 0) return `+${num.toFixed(2)}`
  return num.toFixed(2)
}

/** 金额颜色 */
function amountColor(type: string): string {
  if (type === 'earn' || type === 'bonus' || type === 'admin_adjust') return 'text-green-600'
  if (type === 'spend') return 'text-red-500'
  return 'text-muted-foreground'
}

/** 类型图标 */
function typeIcon(type: string) {
  if (type === 'earn' || type === 'bonus') return TrendingUp
  if (type === 'spend') return TrendingDown
  return Coins
}

/** 签到 */
async function handleCheckin() {
  const result = await creditsStore.doCheckin()
  if (result.success) {
    showSuccess(result.message)
  } else {
    showError(result.message)
  }
}

/** 加载更多 */
function handleLoadMore() {
  creditsStore.loadMore()
}

onMounted(async () => {
  await Promise.all([
    creditsStore.loadBalance(),
    creditsStore.loadTransactions(1),
  ])
})
</script>

<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- 顶部导航 -->
    <div class="sticky top-0 z-40 bg-background border-b">
      <div class="flex items-center h-12 px-4">
        <button class="p-1 -ml-1" @click="router.back()">
          <ChevronLeft class="h-5 w-5" />
        </button>
        <h1 class="flex-1 text-center font-medium">积分中心</h1>
        <div class="w-6" />
      </div>
    </div>

    <main class="container px-4 py-4 space-y-4">
      <!-- 积分余额卡片 -->
      <CreditBalanceCard :balance="creditsStore.balance" />

      <!-- 签到区域 -->
      <Card>
        <CardContent class="p-4 flex items-center gap-4">
          <div class="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0">
            <Gift class="h-6 w-6 text-white" />
          </div>
          <div class="flex-1">
            <h3 class="font-medium">每日签到</h3>
            <p class="text-sm text-muted-foreground">签到可获得积分奖励</p>
          </div>
          <Button
            size="sm"
            :disabled="creditsStore.checkinLoading"
            @click="handleCheckin"
          >
            <Loader2 v-if="creditsStore.checkinLoading" class="h-4 w-4 animate-spin mr-1" />
            签到
          </Button>
        </CardContent>
      </Card>

      <!-- 积分获取方式 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">积分获取方式</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UserPlus class="h-4 w-4 text-blue-500" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium">注册奖励</p>
              <p class="text-xs text-muted-foreground">新用户注册即送积分</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Calendar class="h-4 w-4 text-green-500" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium">每日签到</p>
              <p class="text-xs text-muted-foreground">每天签到获得积分</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Gift class="h-4 w-4 text-purple-500" />
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium">邀请好友</p>
              <p class="text-xs text-muted-foreground">邀请好友注册获得奖励积分</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 消耗明细 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium text-muted-foreground">积分明细</CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <!-- 空状态 -->
          <div v-if="!creditsStore.loading && creditsStore.transactions.length === 0" class="py-8 text-center text-muted-foreground">
            <Coins class="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p class="text-sm">暂无积分记录</p>
          </div>

          <!-- 按天分组列表 -->
          <template v-for="[date, txList] in groupedTransactions" :key="date">
            <div class="px-4 py-2 bg-muted/30 text-xs font-medium text-muted-foreground border-t first:border-t-0">
              {{ formatDateLabel(date) }}
            </div>
            <div class="divide-y">
              <div
                v-for="tx in txList"
                :key="tx.id"
                class="flex items-center gap-3 px-4 py-3"
              >
                <div class="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <component :is="typeIcon(tx.type)" class="h-4 w-4" :class="amountColor(tx.type)" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm truncate">{{ tx.description || tx.source || tx.type }}</p>
                  <p class="text-xs text-muted-foreground">{{ formatTime(tx.created_at) }}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-sm font-medium" :class="amountColor(tx.type)">
                    {{ formatAmount(tx.amount) }}
                  </p>
                  <p class="text-xs text-muted-foreground">余额 {{ parseFloat(tx.balance_after).toFixed(2) }}</p>
                </div>
              </div>
            </div>
          </template>

          <!-- 加载更多 -->
          <div v-if="creditsStore.hasMore" class="p-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              :disabled="creditsStore.loading"
              @click="handleLoadMore"
            >
              <Loader2 v-if="creditsStore.loading" class="h-4 w-4 animate-spin mr-1" />
              {{ creditsStore.loading ? '加载中...' : '加载更多' }}
            </Button>
          </div>

          <!-- 加载中 -->
          <div v-if="creditsStore.loading && creditsStore.transactions.length === 0" class="py-8 text-center">
            <Loader2 class="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
