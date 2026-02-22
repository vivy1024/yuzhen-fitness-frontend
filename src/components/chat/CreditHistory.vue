<script setup lang="ts">
/**
 * 积分流水历史组件
 * 显示用户积分消耗流水记录
 * 
 * @author 薛小川
 * @created 2026-02-05
 * @requirements 3.4
 */
import { onMounted, ref } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { useCreditStore } from '@/stores/credit'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Coins, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Sparkles,
  Clock
} from 'lucide-vue-next'

const creditStore = useCreditStore()

// 筛选模式
const filterMode = ref<'all' | 'dag' | 'agent'>('all')

// 当前页码
const currentPage = ref(1)

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (days === 1) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

// 获取模式图标
function getModeIcon(mode: string) {
  return mode === 'agent' ? Sparkles : Cpu
}

// 获取模式颜色
function getModeColor(mode: string) {
  return mode === 'agent' ? 'text-purple-500' : 'text-blue-500'
}

// 获取模式名称
function getModeName(mode: string) {
  return mode === 'agent' ? 'Agent' : 'DAG'
}

// 加载数据
async function loadHistory() {
  const mode = filterMode.value === 'all' ? undefined : filterMode.value
  await creditStore.fetchHistory(currentPage.value, mode)
}

// 切换筛选
async function onFilterChange(value: AcceptableValue) {
  if (!value) return
  filterMode.value = String(value) as 'all' | 'dag' | 'agent'
  currentPage.value = 1
  await loadHistory()
}

// 上一页
async function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    await loadHistory()
  }
}

// 下一页
async function nextPage() {
  if (currentPage.value < creditStore.transactionLastPage) {
    currentPage.value++
    await loadHistory()
  }
}

// 初始化
onMounted(async () => {
  await loadHistory()
})
</script>

<template>
  <div class="credit-history space-y-4">
    <!-- 标题和筛选 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Coins class="h-5 w-5 text-muted-foreground" />
        <h3 class="text-lg font-medium">积分流水</h3>
      </div>
      <div class="flex items-center gap-2">
        <Select :model-value="filterMode" @update:model-value="onFilterChange">
          <SelectTrigger class="w-24 h-8">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="dag">DAG</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="ghost" 
          size="icon"
          class="h-8 w-8"
          @click="loadHistory"
          :disabled="creditStore.loading"
        >
          <RefreshCw 
            class="h-4 w-4" 
            :class="creditStore.loading && 'animate-spin'"
          />
        </Button>
      </div>
    </div>

    <!-- 流水列表 -->
    <div v-if="creditStore.transactions.length > 0" class="space-y-2">
      <div 
        v-for="tx in creditStore.transactions" 
        :key="tx.id"
        class="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
      >
        <div class="flex items-center gap-3">
          <div 
            class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="tx.mode === 'agent' ? 'bg-purple-100' : 'bg-blue-100'"
          >
            <component 
              :is="getModeIcon(tx.mode)" 
              class="h-4 w-4"
              :class="getModeColor(tx.mode)"
            />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">
                {{ tx.template_name || '对话查询' }}
              </span>
              <Badge variant="secondary" class="text-xs">
                {{ getModeName(tx.mode) }}
              </Badge>
            </div>
            <div class="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <Clock class="h-3 w-3" />
              <span>{{ formatDate(tx.created_at) }}</span>
              <span>·</span>
              <span>{{ tx.tokens.toLocaleString() }} tokens</span>
            </div>
          </div>
        </div>
        <div class="text-right">
          <span class="text-sm font-medium text-red-500">-{{ tx.credits }}</span>
          <span class="text-xs text-muted-foreground ml-1">积分</span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div 
      v-else-if="!creditStore.loading" 
      class="text-center py-8 text-muted-foreground"
    >
      <Coins class="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p>暂无积分流水记录</p>
    </div>

    <!-- 加载中 -->
    <div 
      v-if="creditStore.loading" 
      class="text-center py-8"
    >
      <RefreshCw class="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
      <p class="text-sm text-muted-foreground mt-2">加载中...</p>
    </div>

    <!-- 分页 -->
    <div 
      v-if="creditStore.transactionTotal > 0" 
      class="flex items-center justify-between pt-2 border-t"
    >
      <span class="text-sm text-muted-foreground">
        共 {{ creditStore.transactionTotal }} 条记录
      </span>
      <div class="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          :disabled="currentPage <= 1"
          @click="prevPage"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <span class="text-sm">
          {{ currentPage }} / {{ creditStore.transactionLastPage }}
        </span>
        <Button 
          variant="outline" 
          size="sm"
          :disabled="currentPage >= creditStore.transactionLastPage"
          @click="nextPage"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
