<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import BottomNav from '@/components/layout/BottomNav.vue'
import { 
  MessageSquare, 
  Dumbbell, 
  Target, 
  User, 
  Crown, 
  Settings, 
  ChevronRight,
  Flame,
  Calendar,
  TrendingUp,
  Activity,
  Apple
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

// 统计数据（暂无训练记录功能，显示为0）
const stats = ref({
  todayWorkouts: 0,
  todayDuration: 0,
  weekDays: 0,
  streak: 0
})

// 导航方法
function goToAiChat() {
  router.push('/ai/chat')
}

function goToExercise() {
  router.push('/exercise')
}

function goToTraining() {
  router.push('/training/plans')
}

function goToFood() {
  router.push('/food')
}

function goToProfile() {
  router.push('/user-profile')
}

function goToMembership() {
  router.push('/membership')
}

function goToSettings() {
  router.push('/settings')
}

onMounted(() => {
  // 加载统计数据
})
</script>

<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
            <Dumbbell class="h-5 w-5 text-white" />
          </div>
          <span class="text-lg font-bold">玉珍健身</span>
        </div>
        
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" @click="goToSettings">
            <Settings class="h-5 w-5" />
          </Button>
          <Avatar class="h-8 w-8 cursor-pointer" @click="goToProfile">
            <AvatarFallback class="bg-primary/10 text-primary text-sm">
              {{ authStore.userName?.charAt(0) || 'U' }}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- 欢迎区域 -->
      <div class="rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold mb-1">
              你好，{{ authStore.userName || '健身达人' }}
            </h1>
            <p class="text-white/80 text-sm">今天也要加油训练哦！</p>
          </div>
          <div v-if="stats.streak > 0" class="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
            <Flame class="h-4 w-4" />
            <span class="text-sm font-medium">连续{{ stats.streak }}天</span>
          </div>
        </div>
        
        <!-- 快速统计 -->
        <div class="grid grid-cols-3 gap-4 mt-6">
          <div class="text-center">
            <div class="text-2xl font-bold">{{ stats.todayWorkouts }}</div>
            <div class="text-xs text-white/70">今日训练</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold">{{ stats.todayDuration }}</div>
            <div class="text-xs text-white/70">训练时长(分)</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold">{{ stats.weekDays }}</div>
            <div class="text-xs text-white/70">本星期训练天</div>
          </div>
        </div>
      </div>

      <!-- 核心功能卡片 -->
      <div class="grid grid-cols-3 gap-3">
        <!-- 智能健身顾问 -->
        <Card 
          class="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-0 bg-gradient-to-br from-pink-500 to-rose-500 text-white"
          @click="goToAiChat"
        >
          <CardContent class="p-4">
            <div class="flex flex-col h-full">
              <div class="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <MessageSquare class="h-5 w-5" />
              </div>
              <h3 class="font-bold text-sm mb-0.5">智能顾问</h3>
              <p class="text-xs text-white/80">专业指导</p>
            </div>
          </CardContent>
        </Card>

        <!-- 动作库 -->
        <Card 
          class="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-0 bg-gradient-to-br from-violet-500 to-purple-500 text-white"
          @click="goToExercise"
        >
          <CardContent class="p-4">
            <div class="flex flex-col h-full">
              <div class="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <Dumbbell class="h-5 w-5" />
              </div>
              <h3 class="font-bold text-sm mb-0.5">动作库</h3>
              <p class="text-xs text-white/80">1790动作</p>
            </div>
          </CardContent>
        </Card>

        <!-- 食物库 -->
        <Card 
          class="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-0 bg-gradient-to-br from-amber-500 to-orange-500 text-white"
          @click="goToFood"
        >
          <CardContent class="p-4">
            <div class="flex flex-col h-full">
              <div class="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <Apple class="h-5 w-5" />
              </div>
              <h3 class="font-bold text-sm mb-0.5">食物库</h3>
              <p class="text-xs text-white/80">1851食物</p>
            </div>
          </CardContent>
        </Card>

        <!-- 训练计划 -->
        <Card 
          class="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-0 bg-gradient-to-br from-cyan-500 to-blue-500 text-white"
          @click="goToTraining"
        >
          <CardContent class="p-4">
            <div class="flex flex-col h-full">
              <div class="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <Target class="h-5 w-5" />
              </div>
              <h3 class="font-bold text-sm mb-0.5">训练计划</h3>
              <p class="text-xs text-white/80">个性定制</p>
            </div>
          </CardContent>
        </Card>

        <!-- 个人档案 -->
        <Card 
          class="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-0 bg-gradient-to-br from-emerald-500 to-teal-500 text-white"
          @click="goToProfile"
        >
          <CardContent class="p-4">
            <div class="flex flex-col h-full">
              <div class="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <User class="h-5 w-5" />
              </div>
              <h3 class="font-bold text-sm mb-0.5">个人档案</h3>
              <p class="text-xs text-white/80">数据追踪</p>
            </div>
          </CardContent>
        </Card>

        <!-- 训练统计 -->
        <Card 
          class="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 border-0 bg-gradient-to-br from-slate-500 to-gray-600 text-white"
          @click="router.push('/training/stats')"
        >
          <CardContent class="p-4">
            <div class="flex flex-col h-full">
              <div class="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                <TrendingUp class="h-5 w-5" />
              </div>
              <h3 class="font-bold text-sm mb-0.5">训练统计</h3>
              <p class="text-xs text-white/80">进度分析</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 会员横幅 -->
      <Card 
        class="cursor-pointer transition-all hover:shadow-md border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50"
        @click="goToMembership"
      >
        <CardContent class="p-4 flex items-center gap-4">
          <div class="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Crown class="h-6 w-6 text-white" />
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-amber-900">升级会员</h3>
            <p class="text-sm text-amber-700">解锁更多训练计划和专业指导</p>
          </div>
          <ChevronRight class="h-5 w-5 text-amber-600" />
        </CardContent>
      </Card>

      <!-- 今日概览 -->
      <Card>
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-lg">今日概览</CardTitle>
            <Activity class="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-3 gap-4">
            <div class="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30">
              <div class="h-10 w-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center">
                <Dumbbell class="h-5 w-5 text-white" />
              </div>
              <div class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ stats.todayWorkouts }}</div>
              <div class="text-xs text-purple-600 dark:text-purple-400">训练次数</div>
            </div>
            <div class="text-center p-3 rounded-xl bg-pink-50 dark:bg-pink-950/30">
              <div class="h-10 w-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Calendar class="h-5 w-5 text-white" />
              </div>
              <div class="text-xl font-bold text-pink-700 dark:text-pink-300">{{ stats.todayDuration }}</div>
              <div class="text-xs text-pink-600 dark:text-pink-400">训练时长</div>
            </div>
            <div class="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
              <div class="h-10 w-10 mx-auto mb-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <TrendingUp class="h-5 w-5 text-white" />
              </div>
              <div class="text-xl font-bold text-emerald-700 dark:text-emerald-300">{{ stats.weekDays }}</div>
              <div class="text-xs text-emerald-600 dark:text-emerald-400">本星期训练</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>
