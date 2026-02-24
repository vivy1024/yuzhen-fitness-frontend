<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="flex items-center px-4 h-14">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" @click="router.back()">
            <ArrowLeft class="h-5 w-5" />
          </Button>
          <h1 class="text-lg font-semibold">通知设置</h1>
        </div>
      </div>
    </header>

    <div class="p-4 space-y-4">
      <!-- 推送订阅 -->
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label class="text-base">推送通知</Label>
              <p class="text-sm text-muted-foreground">
                接收训练提醒和系统通知
              </p>
            </div>
            <Switch
              :checked="notificationStore.pushEnabled"
              :disabled="notificationStore.loading"
              @update:checked="handleTogglePush"
            />
          </div>
        </CardContent>
      </Card>

      <!-- 提醒时间 -->
      <Card>
        <CardContent class="p-4">
          <div class="space-y-3">
            <div class="space-y-0.5">
              <Label class="text-base">训练提醒时间</Label>
              <p class="text-sm text-muted-foreground">
                每天在设定时间提醒你训练
              </p>
            </div>
            <div class="flex items-center gap-3">
              <input
                type="time"
                :value="notificationStore.reminderTime"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                :disabled="!notificationStore.pushEnabled"
                @change="handleReminderTimeChange"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 说明 -->
      <Card>
        <CardContent class="p-4">
          <div class="flex items-start gap-3">
            <Bell class="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div class="text-sm text-muted-foreground space-y-1">
              <p>推送通知需要浏览器授权，开启后可接收：</p>
              <ul class="list-disc list-inside space-y-0.5 ml-1">
                <li>每日训练提醒</li>
                <li>训练计划更新通知</li>
                <li>系统公告</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Bell } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast/use-toast'

const router = useRouter()
const notificationStore = useNotificationStore()
const { toast } = useToast()

const handleTogglePush = async () => {
  try {
    await notificationStore.togglePush()
    toast({
      title: notificationStore.pushEnabled ? '已开启推送' : '已关闭推送',
    })
  } catch {
    toast({
      title: '操作失败',
      description: '请检查浏览器是否允许通知权限',
      variant: 'destructive',
    })
  }
}

const handleReminderTimeChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  try {
    await notificationStore.setReminderTime(target.value)
    toast({ title: '提醒时间已更新' })
  } catch {
    toast({
      title: '更新失败',
      description: '提醒时间更新失败，请稍后重试',
      variant: 'destructive',
    })
  }
}

onMounted(() => {
  notificationStore.initSettings()
})
</script>
