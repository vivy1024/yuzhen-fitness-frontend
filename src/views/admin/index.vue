<script setup lang="ts">
/**
 * 管理后台首页
 * 聚合各项管理功能的入口
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, ClipboardList, Users, BarChart3, Settings, 
  TrendingUp, Brain, Shield, Star, MessageSquare
} from 'lucide-vue-next'
import api from '@/api/auth'

const router = useRouter()

// 统计数据
const stats = ref({
  pendingOrders: 0,
  totalUsers: 0,
  todayRevenue: 0,
  fewshotEligible: 0,
  pendingFeedbacks: 0
})

const loading = ref(true)

onMounted(async () => {
  await loadStats()
})

async function loadStats() {
  loading.value = true
  try {
    // 并行加载各项统计
    const [orderRes, qualityRes] = await Promise.all([
      api.get('/admin/orders/stats').catch(() => ({ data: {} })),
      api.get('/v2/quality/stats').catch(() => ({ data: {} }))
    ])
    
    if (orderRes.code === 200) {
      stats.value.pendingOrders = orderRes.data.reviewing || 0
      stats.value.todayRevenue = orderRes.data.today_revenue || 0
    }
    
    if (qualityRes.code === 200) {
      stats.value.fewshotEligible = qualityRes.data.fewshot_eligible || 0
      stats.value.totalUsers = qualityRes.data.total_sessions || 0
    }

    // 加载反馈统计
    const feedbacksData = localStorage.getItem('yuzhen_feedbacks')
    if (feedbacksData) {
      const feedbacks = JSON.parse(feedbacksData)
      stats.value.pendingFeedbacks = feedbacks.filter((f: any) => f.status === 'pending').length
    }
  } catch (e) {
    console.error('加载统计失败', e)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/settings/about')
}

// 管理功能列表
const adminModules = [
  {
    id: 'orders',
    title: '订单审核',
    description: '审核用户支付截图，管理订单状态',
    icon: ClipboardList,
    route: '/admin/orders',
    badge: () => stats.value.pendingOrders > 0 ? stats.value.pendingOrders : null,
    badgeColor: 'bg-amber-500'
  },
  {
    id: 'feedback',
    title: '反馈管理',
    description: '查看用户反馈，回复用户问题',
    icon: MessageSquare,
    route: '/admin/feedback',
    badge: () => stats.value.pendingFeedbacks > 0 ? stats.value.pendingFeedbacks : null,
    badgeColor: 'bg-blue-500'
  },
  {
    id: 'expert-review',
    title: '专家评审',
    description: '三轨评分核心，审核AI对话质量',
    icon: Star,
    route: '/admin/expert-review',
    badge: () => null
  },
  {
    id: 'ai-monitor',
    title: 'AI服务监控',
    description: '三轨评分统计、Few-Shot池、DAG使用情况',
    icon: Brain,
    route: '/admin/ai-monitor',
    badge: () => null
  },
  {
    id: 'users',
    title: '用户管理',
    description: '用户列表、会员状态、权限管理',
    icon: Users,
    route: '/admin/users',
    badge: () => null
  }
]

function navigateTo(route: string) {
  router.push(route)
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="container flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <div class="flex-1 flex items-center justify-center gap-2">
          <Shield class="h-5 w-5 text-amber-500" />
          <h1 class="text-lg font-semibold">管理后台</h1>
        </div>
        <div class="w-10" />
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- 快速统计 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent class="p-4">
            <div class="text-sm text-muted-foreground">待审核订单</div>
            <div class="text-2xl font-bold text-amber-500">{{ stats.pendingOrders }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-sm text-muted-foreground">今日收入</div>
            <div class="text-2xl font-bold text-green-500">¥{{ Number(stats.todayRevenue || 0).toFixed(2) }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-sm text-muted-foreground">Few-Shot池</div>
            <div class="text-2xl font-bold text-blue-500">{{ stats.fewshotEligible }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="text-sm text-muted-foreground">总会话数</div>
            <div class="text-2xl font-bold">{{ stats.totalUsers }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- 功能模块 -->
      <div class="grid gap-4 md:grid-cols-2">
        <Card 
          v-for="module in adminModules" 
          :key="module.id"
          class="cursor-pointer hover:bg-accent/50 transition-colors"
          @click="navigateTo(module.route)"
        >
          <CardHeader class="pb-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-primary/10">
                  <component :is="module.icon" class="h-5 w-5 text-primary" />
                </div>
                <CardTitle class="text-base">{{ module.title }}</CardTitle>
              </div>
              <span 
                v-if="module.badge()" 
                :class="['px-2 py-0.5 text-xs text-white rounded-full', module.badgeColor]"
              >
                {{ module.badge() }}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>{{ module.description }}</CardDescription>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>
