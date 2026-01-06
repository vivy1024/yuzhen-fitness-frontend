<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="flex items-center justify-between px-4 h-14">
        <button @click="router.back()" class="p-2 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="text-lg font-semibold">反馈管理</h1>
        <div class="w-9"></div>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="p-4 space-y-4">
      <!-- 筛选器 -->
      <Card>
        <CardContent class="p-4">
          <div class="flex flex-wrap gap-3">
            <!-- 状态筛选 -->
            <Select v-model="filters.status">
              <SelectTrigger class="w-[140px]">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
                <SelectItem value="resolved">已解决</SelectItem>
                <SelectItem value="closed">已关闭</SelectItem>
              </SelectContent>
            </Select>

            <!-- 类型筛选 -->
            <Select v-model="filters.type">
              <SelectTrigger class="w-[140px]">
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="feature">功能建议</SelectItem>
                <SelectItem value="bug">Bug报告</SelectItem>
                <SelectItem value="question">使用问题</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>

            <!-- 刷新按钮 -->
            <Button @click="loadFeedbacks" variant="outline" size="sm">
              <RefreshCw :class="['w-4 h-4', isLoading && 'animate-spin']" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent class="p-3">
            <div class="text-xs text-muted-foreground">待处理</div>
            <div class="text-xl font-bold text-amber-500">{{ stats.pending }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-3">
            <div class="text-xs text-muted-foreground">处理中</div>
            <div class="text-xl font-bold text-blue-500">{{ stats.processing }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-3">
            <div class="text-xs text-muted-foreground">已解决</div>
            <div class="text-xl font-bold text-green-500">{{ stats.resolved }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-3">
            <div class="text-xs text-muted-foreground">总数</div>
            <div class="text-xl font-bold">{{ stats.total }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- 反馈列表 -->
      <div v-if="isLoading" class="space-y-3">
        <Skeleton v-for="i in 5" :key="i" class="h-32 w-full" />
      </div>
      <div v-else-if="filteredFeedbacks.length === 0" class="text-center py-12">
        <MessageSquare class="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p class="text-muted-foreground">暂无反馈记录</p>
      </div>
      <div v-else class="space-y-3">
        <Card
          v-for="feedback in filteredFeedbacks"
          :key="feedback.id"
          class="cursor-pointer hover:bg-accent/50 transition-colors"
          @click="viewFeedback(feedback)"
        >
          <CardContent class="p-4">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <Badge :variant="getTypeVariant(feedback.type)">
                  {{ getTypeLabel(feedback.type) }}
                </Badge>
                <Badge :variant="getStatusVariant(feedback.status)">
                  {{ getStatusLabel(feedback.status) }}
                </Badge>
              </div>
              <span class="text-xs text-muted-foreground">
                用户ID: {{ feedback.user_id }}
              </span>
            </div>
            <p class="text-sm line-clamp-2 mb-3">{{ feedback.content }}</p>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ formatDate(feedback.created_at) }}</span>
              <div class="flex items-center gap-2">
                <span v-if="feedback.contact" class="flex items-center gap-1">
                  <Mail class="w-3 h-3" />
                  {{ feedback.contact }}
                </span>
                <span v-if="feedback.images && feedback.images.length > 0" class="flex items-center gap-1">
                  <Image class="w-3 h-3" />
                  {{ feedback.images.length }}张
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- 反馈详情和回复对话框 -->
    <Dialog v-model:open="showDetailDialog">
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>反馈详情</DialogTitle>
        </DialogHeader>
        <div v-if="selectedFeedback" class="space-y-4">
          <!-- 基本信息 -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <Badge :variant="getTypeVariant(selectedFeedback.type)">
                {{ getTypeLabel(selectedFeedback.type) }}
              </Badge>
              <Badge :variant="getStatusVariant(selectedFeedback.status)">
                {{ getStatusLabel(selectedFeedback.status) }}
              </Badge>
            </div>
            <div class="text-sm text-muted-foreground space-y-1">
              <div>用户ID: {{ selectedFeedback.user_id }}</div>
              <div>提交时间: {{ formatDate(selectedFeedback.created_at) }}</div>
              <div v-if="selectedFeedback.contact">联系方式: {{ selectedFeedback.contact }}</div>
            </div>
          </div>

          <Separator />

          <!-- 反馈内容 -->
          <div>
            <Label class="text-base">反馈内容</Label>
            <p class="text-sm mt-2 whitespace-pre-wrap">{{ selectedFeedback.content }}</p>
          </div>

          <!-- 截图 -->
          <div v-if="selectedFeedback.images && selectedFeedback.images.length > 0">
            <Label class="text-base">截图</Label>
            <div class="grid grid-cols-3 gap-2 mt-2">
              <img
                v-for="(image, index) in selectedFeedback.images"
                :key="index"
                :src="image"
                alt="截图"
                class="w-full aspect-square object-cover rounded-lg border cursor-pointer hover:opacity-80"
                @click="previewImage(image)"
              />
            </div>
          </div>

          <Separator />

          <!-- 状态管理 -->
          <div>
            <Label class="text-base">状态管理</Label>
            <Select v-model="replyForm.status" class="mt-2">
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
                <SelectItem value="resolved">已解决</SelectItem>
                <SelectItem value="closed">已关闭</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 官方回复 -->
          <div>
            <Label class="text-base">官方回复</Label>
            <Textarea
              v-model="replyForm.reply"
              placeholder="输入回复内容..."
              rows="4"
              class="mt-2 resize-none"
            />
          </div>

          <!-- 历史回复 -->
          <div v-if="selectedFeedback.reply">
            <Label class="text-base">历史回复</Label>
            <div class="mt-2 p-3 bg-accent rounded-lg">
              <p class="text-sm whitespace-pre-wrap">{{ selectedFeedback.reply }}</p>
              <p class="text-xs text-muted-foreground mt-2">
                {{ formatDate(selectedFeedback.reply_at) }}
              </p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-2 pt-4">
            <Button
              @click="submitReply"
              :disabled="isSubmitting || !replyForm.reply.trim()"
              class="flex-1"
            >
              <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
              {{ isSubmitting ? '提交中...' : '提交回复' }}
            </Button>
            <Button @click="showDetailDialog = false" variant="outline">
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 图片预览对话框 -->
    <Dialog v-model:open="showImagePreview">
      <DialogContent class="max-w-4xl">
        <img :src="previewImageUrl" alt="预览" class="w-full h-auto" />
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, MessageSquare, RefreshCw, Mail, Image, Loader2 } from 'lucide-vue-next'
import * as adminFeedbackApi from '@/api/admin/feedback'
import type { Feedback } from '@/stores/feedback'

const router = useRouter()
const { toast } = useToast()

// 状态
const isLoading = ref(false)
const isSubmitting = ref(false)
const feedbacks = ref<Feedback[]>([])
const showDetailDialog = ref(false)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const selectedFeedback = ref<Feedback | null>(null)

// 筛选器
const filters = ref({
  status: 'all',
  type: 'all'
})

// 回复表单
const replyForm = ref({
  status: 'pending',
  reply: ''
})

// 统计数据
const stats = computed(() => {
  return {
    total: feedbacks.value.length,
    pending: feedbacks.value.filter(f => f.status === 'pending').length,
    processing: feedbacks.value.filter(f => f.status === 'processing').length,
    resolved: feedbacks.value.filter(f => f.status === 'resolved').length
  }
})

// 筛选后的反馈列表
const filteredFeedbacks = computed(() => {
  return feedbacks.value.filter(feedback => {
    if (filters.value.status !== 'all' && feedback.status !== filters.value.status) {
      return false
    }
    if (filters.value.type !== 'all' && feedback.type !== filters.value.type) {
      return false
    }
    return true
  })
})

// 加载反馈列表
const loadFeedbacks = async () => {
  isLoading.value = true
  try {
    feedbacks.value = await adminFeedbackApi.getAllFeedbacks()
  } catch (error: any) {
    toast({
      title: '加载失败',
      description: error.message || '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    isLoading.value = false
  }
}

// 查看反馈详情
const viewFeedback = (feedback: Feedback) => {
  selectedFeedback.value = feedback
  replyForm.value = {
    status: feedback.status,
    reply: ''
  }
  showDetailDialog.value = true
}

// 提交回复
const submitReply = async () => {
  if (!selectedFeedback.value || !replyForm.value.reply.trim()) return

  isSubmitting.value = true
  try {
    await adminFeedbackApi.replyToFeedback(selectedFeedback.value.id, {
      status: replyForm.value.status,
      reply: replyForm.value.reply
    })

    toast({
      title: '回复成功',
      description: '反馈回复已提交'
    })

    // 刷新列表
    await loadFeedbacks()
    showDetailDialog.value = false
  } catch (error: any) {
    toast({
      title: '回复失败',
      description: error.message || '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    isSubmitting.value = false
  }
}

// 预览图片
const previewImage = (url: string) => {
  previewImageUrl.value = url
  showImagePreview.value = true
}

// 获取类型标签
const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    feature: '功能建议',
    bug: 'Bug报告',
    question: '使用问题',
    other: '其他'
  }
  return labels[type] || type
}

// 获取类型变体
const getTypeVariant = (type: string) => {
  const variants: Record<string, any> = {
    feature: 'default',
    bug: 'destructive',
    question: 'secondary',
    other: 'outline'
  }
  return variants[type] || 'default'
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return labels[status] || status
}

// 获取状态变体
const getStatusVariant = (status: string) => {
  const variants: Record<string, any> = {
    pending: 'secondary',
    processing: 'default',
    resolved: 'default',
    closed: 'outline'
  }
  return variants[status] || 'default'
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes === 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// 初始化
onMounted(() => {
  loadFeedbacks()
})
</script>
