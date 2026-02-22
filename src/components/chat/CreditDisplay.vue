<script setup lang="ts">
/**
 * 积分展示组件
 * 显示用户积分余额和消耗进度
 * 
 * @author 薛小川
 * @created 2026-02-05
 * @requirements 7.1, 7.2, 7.4, 5.5
 */
import { computed, onMounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCreditStore } from '@/stores/credit'
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
  Coins,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  ArrowUpCircle
} from 'lucide-vue-next'

// Props
interface Props {
  /** 是否紧凑模式 */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const router = useRouter()
const creditStore = useCreditStore()
const authStore = useAuthStore()

// Sheet状态
const sheetOpen = ref(false)

// 是否已登录
const isLoggedIn = computed(() => authStore.isAuthenticated)

// 会员等级显示
const tierDisplay = computed(() => {
  const tier = creditStore.membershipTier
  switch (tier) {
    case 'energy':
      return { name: '能量会员', color: 'text-purple-500', bgColor: 'bg-purple-100', quota: 200 }
    case 'warmheart':
      return { name: '暖心会员', color: 'text-amber-500', bgColor: 'bg-amber-100', quota: 100 }
    default:
      return { name: '免费用户', color: 'text-gray-500', bgColor: 'bg-gray-100', quota: 30 }
  }
})

// 进度条颜色
const progressColor = computed(() => {
  if (creditStore.isExhausted) return 'bg-red-500'
  if (creditStore.hasLowBalanceWarning) return 'bg-amber-500'
  return 'bg-primary'
})

// 刷新积分数据
async function refreshCredit() {
  await creditStore.refresh()
}

// 跳转到会员页面
function goToMembership() {
  sheetOpen.value = false
  router.push('/membership')
}

// 初始化
onMounted(async () => {
  if (isLoggedIn.value && !creditStore.initialized) {
    await creditStore.init()
  }
})

// 监听登录状态变化
watch(isLoggedIn, async (newVal) => {
  if (newVal) {
    await creditStore.reinit()
  } else {
    creditStore.clearCredit()
  }
})
</script>

<template>
  <div v-if="isLoggedIn" class="credit-display">
    <!-- 紧凑模式：仅显示图标和数字，点击展开Sheet -->
    <template v-if="compact">
      <Sheet v-model:open="sheetOpen">
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            class="h-8 px-2 gap-1.5"
            :class="creditStore.hasLowBalanceWarning && 'text-amber-500'"
          >
            <Coins class="h-4 w-4" />
            <span class="text-xs font-medium">
              {{ creditStore.remaining }}
            </span>
            <AlertTriangle 
              v-if="creditStore.hasLowBalanceWarning" 
              class="h-3 w-3 text-amber-500" 
            />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" class="h-auto max-h-[70vh]">
          <SheetHeader>
            <SheetTitle class="flex items-center gap-2">
              <Coins class="h-5 w-5" />
              今日积分
            </SheetTitle>
            <SheetDescription>
              查看您的积分余额和消耗情况
            </SheetDescription>
          </SheetHeader>
          
          <!-- 详细积分信息 -->
          <div class="space-y-4 py-4">
            <!-- 积分余额 -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <div class="flex items-center gap-2">
                  <Coins class="h-4 w-4 text-primary" />
                  <span>今日积分</span>
                </div>
                <span 
                  class="font-medium"
                  :class="creditStore.hasLowBalanceWarning ? 'text-amber-500' : ''"
                >
                  {{ creditStore.dailyConsumed }}/{{ creditStore.dailyQuota }}
                </span>
              </div>
              <Progress 
                :model-value="creditStore.usagePercent" 
                class="h-2"
                :class="progressColor"
              />
              <p class="text-xs text-muted-foreground">
                剩余 {{ creditStore.remaining }} 积分
              </p>
            </div>

            <!-- 低余额警告 -->
            <div 
              v-if="creditStore.hasLowBalanceWarning && !creditStore.isExhausted" 
              class="flex items-start gap-2 p-3 rounded-lg bg-amber-50"
            >
              <AlertTriangle class="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div class="text-sm text-amber-700">
                <p class="font-medium">积分不足提醒</p>
                <p class="text-xs mt-0.5">今日积分即将用完，升级会员获取更多积分</p>
              </div>
            </div>

            <!-- 积分耗尽提示 -->
            <div 
              v-if="creditStore.isExhausted" 
              class="flex items-start gap-2 p-3 rounded-lg bg-red-50"
            >
              <AlertTriangle class="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div class="text-sm text-red-700">
                <p class="font-medium">积分已用完</p>
                <p class="text-xs mt-0.5">
                  今日积分已耗尽，明日将自动重置。
                  <Button 
                    variant="link" 
                    class="h-auto p-0 text-xs text-red-600 underline"
                    @click="goToMembership"
                  >
                    升级会员
                  </Button>
                  获取更多积分
                </p>
              </div>
            </div>

            <!-- 累计消耗 -->
            <div class="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div class="flex items-center gap-2">
                <TrendingUp class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm text-muted-foreground">累计消耗</span>
              </div>
              <span class="text-sm font-medium">{{ creditStore.totalConsumed }} 积分</span>
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
                  @click="refreshCredit"
                  :disabled="creditStore.loading"
                >
                  <RefreshCw 
                    class="h-4 w-4 mr-1" 
                    :class="creditStore.loading && 'animate-spin'"
                  />
                  刷新
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  @click="goToMembership"
                >
                  <ArrowUpCircle class="h-4 w-4 mr-1" />
                  升级
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
            <Coins class="h-4 w-4 text-muted-foreground" />
            <span class="text-sm font-medium">今日积分</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            class="h-7 w-7"
            @click="refreshCredit"
            :disabled="creditStore.loading"
            title="刷新积分数据"
          >
            <RefreshCw 
              class="h-3.5 w-3.5" 
              :class="creditStore.loading && 'animate-spin'"
            />
          </Button>
        </div>

        <!-- 积分进度 -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-sm">
            <span>已消耗</span>
            <span 
              class="font-medium"
              :class="creditStore.hasLowBalanceWarning ? 'text-amber-500' : 'text-foreground'"
            >
              {{ creditStore.remaining }} 剩余
            </span>
          </div>
          <Progress 
            :model-value="creditStore.usagePercent" 
            class="h-2"
          />
          <div class="flex justify-between text-xs text-muted-foreground">
            <span>已用 {{ creditStore.dailyConsumed }}</span>
            <span>配额 {{ creditStore.dailyQuota }}</span>
          </div>
        </div>

        <!-- 低余额警告 -->
        <div 
          v-if="creditStore.hasLowBalanceWarning && !creditStore.isExhausted" 
          class="flex items-start gap-2 p-2 rounded-md bg-amber-50"
        >
          <AlertTriangle class="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div class="text-sm text-amber-700">
            <p class="font-medium">积分不足</p>
            <p class="text-xs mt-0.5">今日积分即将用完</p>
          </div>
        </div>

        <!-- 积分耗尽提示 -->
        <div 
          v-if="creditStore.isExhausted" 
          class="flex items-start gap-2 p-2 rounded-md bg-red-50"
        >
          <AlertTriangle class="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div class="text-sm text-red-700">
            <p class="font-medium">积分已用完</p>
            <p class="text-xs mt-0.5">
              明日自动重置，
              <Button 
                variant="link" 
                class="h-auto p-0 text-xs text-red-600 underline"
                @click="goToMembership"
              >
                升级会员
              </Button>
              获取更多
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
            <ArrowUpCircle class="h-3 w-3 mr-1" />
            升级获取更多
          </Button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.credit-display :deep(.progress-indicator) {
  transition: width 0.3s ease;
}
</style>
