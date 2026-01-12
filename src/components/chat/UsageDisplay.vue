<script setup lang="ts">
/**
 * 用量展示组件
 * 显示用户今日AI查询用量和剩余次数
 * 
 * @author 薛小川
 * @created 2026-01-11
 * @requirements 6.1-6.5
 */
import { computed, onMounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUsageStore } from '@/stores/usage'
import { useMembershipStore } from '@/stores/membership'
import { useAuthStore } from '@/stores/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  Cpu, 
  Sparkles,
  Gift,
  RefreshCw,
  ChevronRight
} from 'lucide-vue-next'

// Props
interface Props {
  /** 是否显示详细信息 */
  showDetail?: boolean
  /** 是否紧凑模式 */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetail: false,
  compact: false
})

const router = useRouter()
const usageStore = useUsageStore()
const membershipStore = useMembershipStore()
const authStore = useAuthStore()

// Sheet状态
const sheetOpen = ref(false)

// 是否已登录
const isLoggedIn = computed(() => authStore.isAuthenticated)

// DAG用量百分比
const dagUsagePercent = computed(() => {
  const limit = usageStore.dagLimit
  if (limit <= 0) return 0
  return Math.min(100, (usageStore.dagUsed / limit) * 100)
})

// Agent用量百分比
const agentUsagePercent = computed(() => {
  const limit = usageStore.agentLimit
  if (limit <= 0) return 100 // 无限制时显示满
  return Math.min(100, (usageStore.agentUsed / limit) * 100)
})

// 是否显示警告
const showWarning = computed(() => {
  return usageStore.hasLowUsageWarning
})

// 警告消息
const warningMessage = computed(() => {
  const messages: string[] = []
  if (usageStore.isDagLimitReached) {
    messages.push('DAG查询已达上限')
  } else if (usageStore.isDagLow) {
    messages.push(`DAG查询剩余${usageStore.dagRemaining}次`)
  }
  if (usageStore.isAgentLimitReached) {
    messages.push('Agent查询已达上限')
  } else if (usageStore.isAgentLow) {
    messages.push(`Agent查询剩余${usageStore.agentRemaining}次`)
  }
  return messages.join('，')
})

// 是否有额外额度
const hasCredits = computed(() => {
  return usageStore.totalCredits > 0
})

// 会员等级显示
const tierDisplay = computed(() => {
  const tier = membershipStore.currentTier
  switch (tier) {
    case 'energy':
      return { name: '能量会员', color: 'text-purple-500', bgColor: 'bg-purple-100' }
    case 'warmheart':
      return { name: '暖心会员', color: 'text-amber-500', bgColor: 'bg-amber-100' }
    default:
      return { name: '免费用户', color: 'text-gray-500', bgColor: 'bg-gray-100' }
  }
})

// 刷新用量数据
async function refreshUsage() {
  await usageStore.refresh()
}

// 跳转到会员页面
function goToMembership() {
  sheetOpen.value = false
  router.push('/membership')
}

// 初始化
onMounted(async () => {
  if (isLoggedIn.value && !usageStore.initialized) {
    await usageStore.init()
  }
})

// 监听登录状态变化
watch(isLoggedIn, async (newVal) => {
  if (newVal) {
    await usageStore.reinit()
  } else {
    usageStore.clearUsage()
  }
})
</script>

<template>
  <div v-if="isLoggedIn" class="usage-display">
    <!-- 紧凑模式：仅显示图标和数字，点击展开Sheet -->
    <template v-if="compact">
      <Sheet v-model:open="sheetOpen">
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            class="h-8 px-2 gap-1.5"
            :class="showWarning && 'text-amber-500'"
          >
            <Zap class="h-4 w-4" />
            <span class="text-xs font-medium">
              {{ usageStore.dagRemaining }}
            </span>
            <AlertTriangle 
              v-if="showWarning" 
              class="h-3 w-3 text-amber-500" 
            />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" class="h-auto max-h-[70vh]">
          <SheetHeader>
            <SheetTitle class="flex items-center gap-2">
              <TrendingUp class="h-5 w-5" />
              今日用量
            </SheetTitle>
            <SheetDescription>
              查看您的AI查询用量和剩余次数
            </SheetDescription>
          </SheetHeader>
          
          <!-- 详细用量信息 -->
          <div class="space-y-4 py-4">
            <!-- DAG用量 -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <Cpu class="h-4 w-4 text-blue-500" />
                  <span>DAG查询</span>
                </div>
                <span 
                  class="font-medium"
                  :class="usageStore.isDagLow ? 'text-amber-500' : ''"
                >
                  {{ usageStore.dagUsed }}/{{ usageStore.dagLimit }}
                </span>
              </div>
              <Progress :model-value="dagUsagePercent" class="h-2" />
              <p class="text-xs text-muted-foreground">
                剩余 {{ usageStore.dagRemaining }} 次
              </p>
            </div>

            <!-- Agent用量 -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <Sparkles class="h-4 w-4 text-purple-500" />
                  <span>Agent查询</span>
                </div>
                <span 
                  class="font-medium"
                  :class="usageStore.isAgentLow ? 'text-amber-500' : ''"
                >
                  {{ usageStore.agentUsed }}/{{ usageStore.agentLimit }}
                </span>
              </div>
              <Progress :model-value="agentUsagePercent" class="h-2" />
              <p class="text-xs text-muted-foreground">
                剩余 {{ usageStore.agentRemaining }} 次
              </p>
            </div>

            <!-- 额外额度 -->
            <div v-if="hasCredits" class="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div class="flex items-center gap-2">
                <Gift class="h-4 w-4 text-green-500" />
                <span class="text-sm text-green-700">额外额度</span>
              </div>
              <div class="text-sm font-medium text-green-600">
                <span v-if="usageStore.dagCredits > 0">DAG +{{ usageStore.dagCredits }}</span>
                <span v-if="usageStore.dagCredits > 0 && usageStore.agentCredits > 0"> / </span>
                <span v-if="usageStore.agentCredits > 0">Agent +{{ usageStore.agentCredits }}</span>
              </div>
            </div>

            <!-- 警告信息 -->
            <div 
              v-if="showWarning" 
              class="flex items-start gap-2 p-3 rounded-lg bg-amber-50"
            >
              <AlertTriangle class="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div class="text-sm text-amber-700">
                <p class="font-medium">用量提醒</p>
                <p class="text-xs mt-0.5">{{ warningMessage }}</p>
              </div>
            </div>

            <!-- 达到上限提示 -->
            <div 
              v-if="usageStore.isDagLimitReached || usageStore.isAgentLimitReached" 
              class="flex items-start gap-2 p-3 rounded-lg bg-red-50"
            >
              <AlertTriangle class="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div class="text-sm text-red-700">
                <p class="font-medium">已达上限</p>
                <p class="text-xs mt-0.5">
                  {{ usageStore.isDagLimitReached ? 'DAG' : 'Agent' }}查询已达今日上限
                </p>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex items-center justify-between pt-2 border-t">
              <Badge 
                variant="secondary" 
                :class="tierDisplay.bgColor"
              >
                <span :class="tierDisplay.color">{{ tierDisplay.name }}</span>
              </Badge>
              <div class="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  @click="refreshUsage"
                  :disabled="usageStore.loading"
                >
                  <RefreshCw 
                    class="h-4 w-4 mr-1" 
                    :class="usageStore.loading && 'animate-spin'"
                  />
                  刷新
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  @click="goToMembership"
                >
                  <Zap class="h-4 w-4 mr-1" />
                  获取更多
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </template>

    <!-- 详细模式：显示完整信息 -->
    <template v-else>
      <div class="space-y-3 p-3 rounded-lg border bg-card">
        <!-- 标题行 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <TrendingUp class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-medium">今日用量</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            class="h-7 w-7"
            @click="refreshUsage"
            :disabled="usageStore.loading"
            title="刷新用量数据"
          >
            <RefreshCw 
              class="h-3.5 w-3.5" 
              :class="usageStore.loading && 'animate-spin'"
            />
          </Button>
        </div>

        <!-- DAG用量 -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <Cpu class="h-4 w-4 text-blue-500" />
              <span>DAG查询</span>
            </div>
            <span 
              class="font-medium"
              :class="usageStore.isDagLow ? 'text-amber-500' : 'text-foreground'"
            >
              {{ usageStore.dagRemaining }} 剩余
            </span>
          </div>
          <Progress :model-value="dagUsagePercent" class="h-2" />
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>已用 {{ usageStore.dagUsed }}</span>
            <span>上限 {{ usageStore.dagLimit }}</span>
          </div>
        </div>

        <!-- Agent用量 -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <Sparkles class="h-4 w-4 text-purple-500" />
              <span>Agent查询</span>
            </div>
            <span 
              class="font-medium"
              :class="usageStore.isAgentLow ? 'text-amber-500' : 'text-foreground'"
            >
              {{ usageStore.agentRemaining }} 剩余
            </span>
          </div>
          <Progress :model-value="agentUsagePercent" class="h-2" />
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>已用 {{ usageStore.agentUsed }}</span>
            <span>上限 {{ usageStore.agentLimit }}</span>
          </div>
        </div>

        <!-- 额外额度 -->
        <div v-if="hasCredits" class="flex items-center justify-between p-2 rounded-md bg-green-50">
          <div class="flex items-center gap-2">
            <Gift class="h-4 w-4 text-green-500" />
            <span class="text-sm text-green-700">额外额度</span>
          </div>
          <div class="text-sm font-medium text-green-600">
            <span v-if="usageStore.dagCredits > 0">DAG +{{ usageStore.dagCredits }}</span>
            <span v-if="usageStore.dagCredits > 0 && usageStore.agentCredits > 0"> / </span>
            <span v-if="usageStore.agentCredits > 0">Agent +{{ usageStore.agentCredits }}</span>
          </div>
        </div>

        <!-- 警告信息 -->
        <div 
          v-if="showWarning" 
          class="flex items-start gap-2 p-2 rounded-md bg-amber-50"
        >
          <AlertTriangle class="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div class="text-sm text-amber-700">
            <p class="font-medium">用量提醒</p>
            <p class="text-xs mt-0.5">{{ warningMessage }}</p>
          </div>
        </div>

        <!-- 达到上限提示 -->
        <div 
          v-if="usageStore.isDagLimitReached || usageStore.isAgentLimitReached" 
          class="flex items-start gap-2 p-2 rounded-md bg-red-50"
        >
          <AlertTriangle class="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div class="text-sm text-red-700">
            <p class="font-medium">已达上限</p>
            <p class="text-xs mt-0.5">
              {{ usageStore.isDagLimitReached ? 'DAG' : 'Agent' }}查询已达今日上限，
              <Button 
                variant="link" 
                class="h-auto p-0 text-xs text-red-600 underline"
                @click="goToMembership"
              >
                升级会员
              </Button>
              获取更多次数
            </p>
          </div>
        </div>

        <!-- 会员状态 -->
        <div class="flex items-center justify-between pt-2 border-t">
          <Badge 
            variant="secondary" 
            :class="tierDisplay.bgColor"
          >
            <span :class="tierDisplay.color">{{ tierDisplay.name }}</span>
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            class="h-7 text-xs"
            @click="goToMembership"
          >
            <Zap class="h-3 w-3 mr-1" />
            获取更多次数
          </Button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.usage-display :deep(.progress-indicator) {
  transition: width 0.3s ease;
}
</style>
