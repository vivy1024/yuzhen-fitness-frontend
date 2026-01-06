<script setup lang="ts">
/**
 * 会员中心页面
 * 显示当前会员状态、权益、套餐选择、账单历史
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMembershipStore } from '@/stores/membership'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import PricingPlans from '@/components/membership/PricingPlans.vue'
import PaymentFlow from '@/components/membership/PaymentFlow.vue'
import BillingHistory from '@/components/membership/BillingHistory.vue'
import { showSuccess, showError } from '@/components/ui/toast'
import { 
  ArrowLeft, 
  Crown, 
  Sparkles, 
  Calendar, 
  Clock, 
  Check,
  MessageSquare,
  Target,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-vue-next'
import type { MembershipTier } from '@/api/membership'

const router = useRouter()
const membershipStore = useMembershipStore()
const authStore = useAuthStore()

// 当前选中的标签页
const activeTab = ref('plans')

// 支付弹窗状态
const showPaymentDialog = ref(false)
const selectedTier = ref<MembershipTier | null>(null)

// 取消自动续费确认弹窗
const showCancelAutoRenewDialog = ref(false)

// 会员权益列表 - MVP阶段简化版
const memberBenefits = computed(() => {
  // 从tiers中找到各等级的权益
  const freeTier = membershipStore.tiers.find(t => t.slug === 'free')
  const warmheartTier = membershipStore.tiers.find(t => t.slug === 'warmheart')
  
  const freeAiQueries = freeTier?.limits?.daily_ai_queries ?? 5
  const freeTrainingPlans = freeTier?.limits?.max_training_plans ?? 3
  const freeDagTemplates = freeTier?.limits?.dag_template_count ?? 13
  
  const vipAiQueries = warmheartTier?.limits?.daily_ai_queries ?? 30
  const vipTrainingPlans = warmheartTier?.limits?.max_training_plans ?? 10
  const vipDagTemplates = warmheartTier?.limits?.dag_template_count ?? 13
  
  const benefits = [
    {
      icon: MessageSquare,
      title: 'AI对话次数',
      free: `${freeAiQueries}次/天`,
      vip: `${vipAiQueries}次/天`,
      color: 'text-pink-500'
    },
    {
      icon: Sparkles,
      title: 'AI场景',
      free: `${freeDagTemplates}个（全部）`,
      vip: `${vipDagTemplates}个（全部）`,
      color: 'text-blue-500'
    },
    {
      icon: Target,
      title: '训练计划',
      free: `最多${freeTrainingPlans}个`,
      vip: `最多${vipTrainingPlans}个`,
      color: 'text-purple-500'
    },
    {
      icon: Zap,
      title: '高级功能',
      free: '基础功能',
      vip: '全部解锁',
      color: 'text-amber-500'
    }
  ]
  return benefits
})

// 选择套餐
function handleSelectTier(tier: MembershipTier) {
  selectedTier.value = tier
  showPaymentDialog.value = true
}

// 支付成功
function handlePaymentSuccess() {
  showPaymentDialog.value = false
  selectedTier.value = null
  showSuccess('会员开通成功！')
  membershipStore.fetchMembership()
}

// 支付取消
function handlePaymentCancel() {
  showPaymentDialog.value = false
  selectedTier.value = null
}

// 切换自动续费
async function handleToggleAutoRenew() {
  if (membershipStore.autoRenewEnabled) {
    // 如果当前是开启状态，显示确认弹窗
    showCancelAutoRenewDialog.value = true
  } else {
    // 如果当前是关闭状态，直接开启
    const result = await membershipStore.toggleAutoRenew()
    if (result.success) {
      showSuccess('已开启自动续费')
    } else {
      showError(result.message || '操作失败')
    }
  }
}

// 确认取消自动续费
async function confirmCancelAutoRenew() {
  showCancelAutoRenewDialog.value = false
  const result = await membershipStore.toggleAutoRenew()
  if (result.success) {
    showSuccess('已关闭自动续费')
  } else {
    showError(result.message || '操作失败')
  }
}

// 返回
function goBack() {
  router.back()
}

onMounted(async () => {
  await membershipStore.init()
})
</script>

<template>
  <div class="min-h-screen bg-background pb-6">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <h1 class="flex-1 text-center text-lg font-semibold">会员中心</h1>
        <div class="w-10" /> <!-- 占位 -->
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- 会员状态卡片 -->
      <Card :class="[
        'overflow-hidden',
        membershipStore.isVip 
          ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0' 
          : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900'
      ]">
        <CardContent class="p-6">
          <!-- 加载状态 -->
          <div v-if="membershipStore.loading" class="space-y-4">
            <div class="flex items-center gap-4">
              <Skeleton class="h-16 w-16 rounded-full" />
              <div class="space-y-2">
                <Skeleton class="h-6 w-32" />
                <Skeleton class="h-4 w-24" />
              </div>
            </div>
          </div>

          <!-- 会员信息 -->
          <div v-else class="space-y-4">
            <div class="flex items-center gap-4">
              <div :class="[
                'h-16 w-16 rounded-full flex items-center justify-center',
                membershipStore.isVip ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-700'
              ]">
                <Crown :class="[
                  'h-8 w-8',
                  membershipStore.isVip ? 'text-white' : 'text-slate-500'
                ]" />
              </div>
              <div>
                <h2 class="text-xl font-bold">{{ membershipStore.membershipName }}</h2>
                <p :class="membershipStore.isVip ? 'text-white/80' : 'text-muted-foreground'" class="text-sm">
                  {{ authStore.userName || '用户' }}
                </p>
              </div>
            </div>

            <!-- VIP状态信息 -->
            <div v-if="membershipStore.isVip" class="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div>
                <div class="flex items-center gap-2 text-white/70 text-sm">
                  <Calendar class="h-4 w-4" />
                  到期时间
                </div>
                <p class="font-semibold mt-1">{{ membershipStore.expiresAtFormatted }}</p>
              </div>
              <div>
                <div class="flex items-center gap-2 text-white/70 text-sm">
                  <Clock class="h-4 w-4" />
                  剩余天数
                </div>
                <p class="font-semibold mt-1">
                  {{ membershipStore.remainingDays }}天
                  <Badge v-if="membershipStore.isExpiringSoon" variant="destructive" class="ml-2 text-xs">
                    即将到期
                  </Badge>
                </p>
              </div>
            </div>

            <!-- 免费用户提示 -->
            <div v-else class="pt-4 border-t">
              <p class="text-sm text-muted-foreground">
                升级会员，解锁更多专业功能
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 自动续费设置（仅VIP显示） -->
      <Card v-if="membershipStore.isVip">
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label class="text-base">自动续费</Label>
              <p class="text-sm text-muted-foreground">
                到期后自动续费，可随时取消
              </p>
            </div>
            <Switch 
              :checked="membershipStore.autoRenewEnabled"
              @update:checked="handleToggleAutoRenew"
            />
          </div>
        </CardContent>
      </Card>

      <!-- 会员权益对比 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <Sparkles class="h-5 w-5 text-amber-500" />
            会员权益
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div 
              v-for="benefit in memberBenefits" 
              :key="benefit.title"
              class="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div :class="['h-10 w-10 rounded-lg bg-background flex items-center justify-center', benefit.color]">
                <component :is="benefit.icon" class="h-5 w-5" />
              </div>
              <div class="flex-1">
                <p class="font-medium text-sm">{{ benefit.title }}</p>
              </div>
              <div class="text-right text-sm">
                <p class="text-muted-foreground">免费: {{ benefit.free }}</p>
                <p class="text-amber-600 font-medium">VIP: {{ benefit.vip }}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 标签页：套餐/账单 -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="plans">会员套餐</TabsTrigger>
          <TabsTrigger value="billing">账单记录</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" class="mt-4">
          <PricingPlans 
            :tiers="membershipStore.tiers"
            :current-tier-id="membershipStore.membership?.membership_id"
            :loading="membershipStore.loading"
            @select="handleSelectTier"
          />
        </TabsContent>

        <TabsContent value="billing" class="mt-4">
          <BillingHistory />
        </TabsContent>
      </Tabs>
    </main>

    <!-- 支付弹窗 -->
    <PaymentFlow 
      v-model:open="showPaymentDialog"
      :tier="selectedTier"
      @success="handlePaymentSuccess"
      @cancel="handlePaymentCancel"
    />

    <!-- 取消自动续费确认弹窗 -->
    <AlertDialog v-model:open="showCancelAutoRenewDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认关闭自动续费？</AlertDialogTitle>
          <AlertDialogDescription>
            关闭后，会员到期将不会自动续费。您可以随时重新开启。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction @click="confirmCancelAutoRenew">确认关闭</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
