<script setup lang="ts">
/**
 * 我的页面
 * 整合个人中心、会员、设置等功能入口
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMembershipStore } from '@/stores/membership'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import BottomNav from '@/components/layout/BottomNav.vue'
import { 
  User, 
  Crown, 
  Settings, 
  ChevronRight,
  History,
  Heart,
  HelpCircle,
  MessageSquare,
  FileText,
  Bell,
  Shield,
  Star
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const membershipStore = useMembershipStore()

// 用户头像首字母
const avatarInitial = computed(() => {
  return authStore.userName?.charAt(0)?.toUpperCase() || 'U'
})

// 会员状态
const membershipLabel = computed(() => {
  if (!membershipStore.membership) return '普通用户'
  return membershipStore.membership.tier_name || '普通用户'
})

const isMember = computed(() => {
  return membershipStore.membership?.is_active || false
})

// 菜单项
const menuSections = [
  {
    title: '我的服务',
    items: [
      { icon: History, label: '训练记录', path: '/training/history', color: 'text-blue-500' },
      { icon: Heart, label: '我的收藏', path: '/favorites', color: 'text-pink-500' },
      { icon: Star, label: '训练统计', path: '/training/stats', color: 'text-amber-500' },
    ]
  },
  {
    title: '会员服务',
    items: [
      { icon: Crown, label: '会员中心', path: '/membership', color: 'text-amber-500', badge: isMember.value ? '' : '升级' },
    ]
  },
  {
    title: '更多',
    items: [
      { icon: Bell, label: '消息通知', path: '/notifications', color: 'text-purple-500' },
      { icon: HelpCircle, label: '帮助中心', path: '/help', color: 'text-cyan-500' },
      { icon: MessageSquare, label: '意见反馈', path: '/feedback', color: 'text-green-500' },
      { icon: FileText, label: '用户协议', path: '/legal/terms', color: 'text-slate-500' },
      { icon: Shield, label: '隐私政策', path: '/legal/privacy', color: 'text-slate-500' },
    ]
  }
]

// 导航方法
function goToProfile() {
  router.push('/user-profile')
}

function goToSettings() {
  router.push('/settings')
}

function goToMembership() {
  router.push('/membership')
}

function navigateTo(path: string) {
  router.push(path)
}

onMounted(() => {
  // 加载会员状态
  membershipStore.fetchMembership()
})
</script>

<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- 顶部用户信息区域 -->
    <div class="bg-gradient-to-br from-purple-600 to-blue-600 pt-12 pb-8 px-4">
      <div class="flex items-center gap-4">
        <!-- 头像 -->
        <Avatar class="h-16 w-16 border-2 border-white/30 cursor-pointer" @click="goToProfile">
          <AvatarFallback class="bg-white/20 text-white text-xl font-bold">
            {{ avatarInitial }}
          </AvatarFallback>
        </Avatar>
        
        <!-- 用户信息 -->
        <div class="flex-1" @click="goToProfile">
          <h2 class="text-xl font-bold text-white">
            {{ authStore.userName || '健身达人' }}
          </h2>
          <div class="flex items-center gap-2 mt-1">
            <Badge 
              :variant="isMember ? 'default' : 'secondary'"
              class="text-xs"
              :class="isMember ? 'bg-amber-500 hover:bg-amber-600' : 'bg-white/20 text-white'"
            >
              <Crown v-if="isMember" class="h-3 w-3 mr-1" />
              {{ membershipLabel }}
            </Badge>
          </div>
        </div>
        
        <!-- 设置按钮 -->
        <Button variant="ghost" size="icon" class="text-white hover:bg-white/20" @click="goToSettings">
          <Settings class="h-5 w-5" />
        </Button>
      </div>
      
      <!-- 快捷入口 -->
      <div class="grid grid-cols-4 gap-4 mt-6">
        <div class="text-center cursor-pointer" @click="goToProfile">
          <div class="h-10 w-10 mx-auto rounded-full bg-white/20 flex items-center justify-center">
            <User class="h-5 w-5 text-white" />
          </div>
          <span class="text-xs text-white/80 mt-1 block">个人档案</span>
        </div>
        <div class="text-center cursor-pointer" @click="navigateTo('/training/history')">
          <div class="h-10 w-10 mx-auto rounded-full bg-white/20 flex items-center justify-center">
            <History class="h-5 w-5 text-white" />
          </div>
          <span class="text-xs text-white/80 mt-1 block">训练记录</span>
        </div>
        <div class="text-center cursor-pointer" @click="navigateTo('/training/stats')">
          <div class="h-10 w-10 mx-auto rounded-full bg-white/20 flex items-center justify-center">
            <Star class="h-5 w-5 text-white" />
          </div>
          <span class="text-xs text-white/80 mt-1 block">训练统计</span>
        </div>
        <div class="text-center cursor-pointer" @click="goToMembership">
          <div class="h-10 w-10 mx-auto rounded-full bg-white/20 flex items-center justify-center">
            <Crown class="h-5 w-5 text-white" />
          </div>
          <span class="text-xs text-white/80 mt-1 block">会员中心</span>
        </div>
      </div>
    </div>

    <main class="container px-4 py-4 space-y-4">
      <!-- 会员横幅（非会员显示） -->
      <Card 
        v-if="!isMember"
        class="cursor-pointer border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30"
        @click="goToMembership"
      >
        <CardContent class="p-4 flex items-center gap-4">
          <div class="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Crown class="h-6 w-6 text-white" />
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-amber-900 dark:text-amber-100">升级会员</h3>
            <p class="text-sm text-amber-700 dark:text-amber-300">解锁更多训练计划和专业指导</p>
          </div>
          <ChevronRight class="h-5 w-5 text-amber-600" />
        </CardContent>
      </Card>

      <!-- 菜单列表 -->
      <template v-for="section in menuSections" :key="section.title">
        <Card>
          <CardContent class="p-0">
            <div class="px-4 py-3 border-b">
              <h3 class="text-sm font-medium text-muted-foreground">{{ section.title }}</h3>
            </div>
            <div class="divide-y">
              <div 
                v-for="item in section.items" 
                :key="item.path"
                class="flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors"
                @click="navigateTo(item.path)"
              >
                <div class="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                  <component :is="item.icon" class="h-5 w-5" :class="item.color" />
                </div>
                <span class="flex-1 font-medium">{{ item.label }}</span>
                <Badge v-if="item.badge" variant="secondary" class="text-xs">
                  {{ item.badge }}
                </Badge>
                <ChevronRight class="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </template>

      <!-- 版本信息 -->
      <div class="text-center py-4 text-sm text-muted-foreground">
        <p>玉珍健身 v3.0.0</p>
      </div>
    </main>

    <!-- 底部导航 -->
    <BottomNav />
  </div>
</template>
