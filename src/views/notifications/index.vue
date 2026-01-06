<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="flex items-center justify-between px-4 h-14">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" @click="router.back()">
            <ArrowLeft class="h-5 w-5" />
          </Button>
          <h1 class="text-lg font-semibold">消息通知</h1>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            @click="markAllAsRead"
            :disabled="unreadCount === 0"
          >
            全部已读
          </Button>
        </div>
      </div>
    </header>

    <!-- 分类筛选 -->
    <div class="sticky top-14 z-10 bg-background border-b">
      <Tabs v-model="activeCategory" class="w-full">
        <TabsList class="w-full grid grid-cols-4 h-12">
          <TabsTrigger value="all">
            全部
            <Badge v-if="unreadCount > 0" variant="destructive" class="ml-2">
              {{ unreadCount }}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="system">系统</TabsTrigger>
          <TabsTrigger value="training">训练</TabsTrigger>
          <TabsTrigger value="membership">会员</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <!-- 通知列表 -->
    <div class="p-4">
      <!-- 加载状态 -->
      <div v-if="loading" class="space-y-3">
        <Skeleton v-for="i in 5" :key="i" class="h-24 w-full" />
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="filteredNotifications.length === 0"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <Bell class="h-16 w-16 text-muted-foreground mb-4" />
        <p class="text-muted-foreground">暂无通知</p>
      </div>

      <!-- 通知列表 -->
      <div v-else class="space-y-3">
        <Card
          v-for="notification in filteredNotifications"
          :key="notification.id"
          :class="[
            'cursor-pointer transition-colors',
            !notification.read && 'bg-accent/50'
          ]"
          @click="handleNotificationClick(notification)"
        >
          <CardContent class="p-4">
            <div class="flex items-start gap-3">
              <!-- 图标 -->
              <div
                :class="[
                  'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                  getNotificationIconClass(notification.type)
                ]"
              >
                <component :is="getNotificationIcon(notification.type)" class="h-5 w-5" />
              </div>

              <!-- 内容 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <h3 class="font-medium text-sm">{{ notification.title }}</h3>
                  <Badge
                    v-if="!notification.read"
                    variant="destructive"
                    class="flex-shrink-0"
                  >
                    未读
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {{ notification.content }}
                </p>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-muted-foreground">
                    {{ formatTime(notification.created_at) }}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click.stop="deleteNotification(notification.id)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Bell, Info, Dumbbell, Crown, Trash2 } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

const router = useRouter()
const notificationStore = useNotificationStore()
const { toast } = useToast()

// State
const activeCategory = ref<'all' | 'system' | 'training' | 'membership'>('all')
const loading = ref(false)

// Computed
const unreadCount = computed(() => notificationStore.unreadCount)
const filteredNotifications = computed(() => {
  if (activeCategory.value === 'all') {
    return notificationStore.notifications
  }
  return notificationStore.notifications.filter(
    (n) => n.type === activeCategory.value
  )
})

// Methods
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'system':
      return Info
    case 'training':
      return Dumbbell
    case 'membership':
      return Crown
    default:
      return Bell
  }
}

const getNotificationIconClass = (type: string) => {
  switch (type) {
    case 'system':
      return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
    case 'training':
      return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
    case 'membership':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleNotificationClick = async (notification: any) => {
  // 标记为已读
  if (!notification.read) {
    await notificationStore.markAsRead(notification.id)
  }

  // 根据通知类型跳转到对应页面
  if (notification.action_url) {
    router.push(notification.action_url)
  }
}

const markAllAsRead = async () => {
  try {
    await notificationStore.markAllAsRead()
    toast({
      title: '操作成功',
      description: '已将所有通知标记为已读',
    })
  } catch (error) {
    toast({
      title: '操作失败',
      description: '标记已读失败，请稍后重试',
      variant: 'destructive',
    })
  }
}

const deleteNotification = async (id: string) => {
  try {
    await notificationStore.deleteNotification(id)
    toast({
      title: '删除成功',
      description: '通知已删除',
    })
  } catch (error) {
    toast({
      title: '删除失败',
      description: '删除通知失败，请稍后重试',
      variant: 'destructive',
    })
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await notificationStore.fetchNotifications()
  } catch (error) {
    toast({
      title: '加载失败',
      description: '获取通知列表失败，请稍后重试',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
})
</script>
