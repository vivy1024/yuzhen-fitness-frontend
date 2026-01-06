<script setup lang="ts">
/**
 * 训练主页面
 * 整合训练计划、训练记录、训练统计等功能入口
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import BottomNav from '@/components/layout/BottomNav.vue'
import { 
  Target, 
  History, 
  TrendingUp, 
  Calendar,
  Dumbbell,
  ChevronRight,
  Play,
  Clock,
  Flame
} from 'lucide-vue-next'

const router = useRouter()

// 当前选中的标签
const activeTab = ref('overview')

// 统计数据
const stats = ref({
  todayWorkouts: 0,
  weekWorkouts: 0,
  monthWorkouts: 0,
  totalDuration: 0,
  streak: 0
})

// 快捷入口
const quickActions = [
  { 
    icon: Target, 
    label: '训练计划', 
    desc: '查看和管理计划',
    path: '/training/plans', 
    color: 'from-cyan-500 to-blue-500' 
  },
  { 
    icon: History, 
    label: '训练记录', 
    desc: '查看历史记录',
    path: '/training/history', 
    color: 'from-purple-500 to-violet-500' 
  },
  { 
    icon: TrendingUp, 
    label: '训练统计', 
    desc: '动作完成情况分析',
    path: '/training/stats', 
    color: 'from-emerald-500 to-teal-500' 
  },
  { 
    icon: Calendar, 
    label: '进度追踪', 
    desc: '体重、目标、趋势',
    path: '/training/progress', 
    color: 'from-orange-500 to-amber-500' 
  },
]

// 导航方法
function navigateTo(path: string) {
  router.push(path)
}

function startQuickTraining() {
  router.push('/training/session')
}

onMounted(() => {
  // 加载统计数据
})
</script>

<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- 顶部区域 -->
    <div class="bg-gradient-to-br from-cyan-600 to-blue-600 pt-12 pb-6 px-4">
      <h1 class="text-2xl font-bold text-white mb-2">训练中心</h1>
      <p class="text-white/80 text-sm">管理你的训练计划和记录</p>
      
      <!-- 快速统计 -->
      <div class="grid grid-cols-3 gap-3 mt-6">
        <div class="bg-white/20 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ stats.todayWorkouts }}</div>
          <div class="text-xs text-white/70">今日训练</div>
        </div>
        <div class="bg-white/20 rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-white">{{ stats.weekWorkouts }}</div>
          <div class="text-xs text-white/70">本星期训练</div>
        </div>
        <div class="bg-white/20 rounded-xl p-3 text-center">
          <div class="flex items-center justify-center gap-1">
            <Flame class="h-5 w-5 text-orange-300" />
            <span class="text-2xl font-bold text-white">{{ stats.streak }}</span>
          </div>
          <div class="text-xs text-white/70">连续天数</div>
        </div>
      </div>
    </div>

    <main class="container px-4 py-6 space-y-6">
      <!-- 快速开始训练 -->
      <Card class="border-0 bg-gradient-to-r from-pink-500 to-rose-500 text-white cursor-pointer hover:shadow-lg transition-shadow" @click="startQuickTraining">
        <CardContent class="p-4 flex items-center gap-4">
          <div class="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <Play class="h-6 w-6" />
          </div>
          <div class="flex-1">
            <h3 class="font-bold">开始训练</h3>
            <p class="text-sm text-white/80">快速开始一次训练</p>
          </div>
          <ChevronRight class="h-5 w-5" />
        </CardContent>
      </Card>

      <!-- 功能入口 -->
      <div class="space-y-3">
        <h2 class="text-lg font-semibold">功能</h2>
        <div class="grid grid-cols-1 gap-3">
          <Card 
            v-for="action in quickActions" 
            :key="action.path"
            class="cursor-pointer hover:shadow-md transition-shadow"
            @click="navigateTo(action.path)"
          >
            <CardContent class="p-4 flex items-center gap-4">
              <div 
                class="h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white"
                :class="action.color"
              >
                <component :is="action.icon" class="h-6 w-6" />
              </div>
              <div class="flex-1">
                <h3 class="font-semibold">{{ action.label }}</h3>
                <p class="text-sm text-muted-foreground">{{ action.desc }}</p>
              </div>
              <ChevronRight class="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- 本星期概览 -->
      <Card>
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-base">本星期概览</CardTitle>
            <Button variant="ghost" size="sm" @click="navigateTo('/training/stats')">
              查看详情
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-4">
            <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <div class="flex items-center gap-2 mb-2">
                <Dumbbell class="h-4 w-4 text-blue-500" />
                <span class="text-sm text-muted-foreground">训练次数</span>
              </div>
              <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ stats.weekWorkouts }}</div>
            </div>
            <div class="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30">
              <div class="flex items-center gap-2 mb-2">
                <Clock class="h-4 w-4 text-purple-500" />
                <span class="text-sm text-muted-foreground">训练时长</span>
              </div>
              <div class="text-2xl font-bold text-purple-700 dark:text-purple-300">{{ stats.totalDuration }}分</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 最近训练 -->
      <Card>
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-base">最近训练</CardTitle>
            <Button variant="ghost" size="sm" @click="navigateTo('/training/history')">
              查看全部
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-center py-8 text-muted-foreground">
            <Calendar class="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>暂无训练记录</p>
            <p class="text-sm mt-1">开始你的第一次训练吧</p>
          </div>
        </CardContent>
      </Card>
    </main>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>
