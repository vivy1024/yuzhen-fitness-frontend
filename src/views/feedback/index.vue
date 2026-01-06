<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="flex items-center justify-between px-4 h-14">
        <button @click="router.back()" class="p-2 hover:bg-accent rounded-lg transition-colors">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 class="text-lg font-semibold">意见反馈</h1>
        <div class="w-9"></div>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="p-4 space-y-6 pb-20">
      <!-- 反馈表单 -->
      <Card>
        <CardHeader>
          <CardTitle>提交反馈</CardTitle>
          <CardDescription>您的反馈将帮助我们改进产品</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- 反馈类型 -->
          <div class="space-y-2">
            <Label>反馈类型</Label>
            <Select v-model="feedbackForm.type">
              <SelectTrigger>
                <SelectValue placeholder="请选择反馈类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feature">功能建议</SelectItem>
                <SelectItem value="bug">Bug报告</SelectItem>
                <SelectItem value="question">使用问题</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 反馈内容 -->
          <div class="space-y-2">
            <Label>反馈内容 <span class="text-destructive">*</span></Label>
            <Textarea
              v-model="feedbackForm.content"
              placeholder="请详细描述您的问题或建议..."
              rows="6"
              class="resize-none"
            />
            <p class="text-xs text-muted-foreground">
              {{ feedbackForm.content.length }}/500
            </p>
          </div>

          <!-- 截图上传 -->
          <div class="space-y-2">
            <Label>截图（可选，最多3张）</Label>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="(image, index) in feedbackForm.images"
                :key="index"
                class="relative aspect-square rounded-lg border overflow-hidden"
              >
                <img :src="image" alt="截图" class="w-full h-full object-cover" />
                <button
                  @click="removeImage(index)"
                  class="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X class="w-3 h-3" />
                </button>
              </div>
              <label
                v-if="feedbackForm.images.length < 3"
                class="aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
              >
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageUpload"
                />
                <Plus class="w-6 h-6 text-muted-foreground" />
              </label>
            </div>
          </div>

          <!-- 联系方式 -->
          <div class="space-y-2">
            <Label>联系方式（可选）</Label>
            <Input
              v-model="feedbackForm.contact"
              placeholder="邮箱或手机号，方便我们联系您"
            />
          </div>

          <!-- 提交按钮 -->
          <Button
            @click="submitFeedback"
            :disabled="!canSubmit || isSubmitting"
            class="w-full"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
            {{ isSubmitting ? '提交中...' : '提交反馈' }}
          </Button>
        </CardContent>
      </Card>

      <!-- 历史反馈记录 -->
      <Card>
        <CardHeader>
          <CardTitle>历史反馈</CardTitle>
          <CardDescription>查看您之前提交的反馈</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="isLoadingHistory" class="space-y-3">
            <Skeleton v-for="i in 3" :key="i" class="h-20 w-full" />
          </div>
          <div v-else-if="feedbackHistory.length === 0" class="text-center py-8 text-muted-foreground">
            <MessageSquare class="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无反馈记录</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="item in feedbackHistory"
              :key="item.id"
              class="p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
              @click="viewFeedbackDetail(item)"
            >
              <div class="flex items-start justify-between mb-2">
                <Badge :variant="getTypeVariant(item.type)">
                  {{ getTypeLabel(item.type) }}
                </Badge>
                <Badge :variant="getStatusVariant(item.status)">
                  {{ getStatusLabel(item.status) }}
                </Badge>
              </div>
              <p class="text-sm line-clamp-2 mb-2">{{ item.content }}</p>
              <div class="flex items-center justify-between text-xs text-muted-foreground">
                <span>{{ formatDate(item.created_at) }}</span>
                <span v-if="item.reply">已回复</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 反馈详情对话框 -->
    <Dialog v-model:open="showDetailDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>反馈详情</DialogTitle>
        </DialogHeader>
        <div v-if="selectedFeedback" class="space-y-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <Badge :variant="getTypeVariant(selectedFeedback.type)">
                {{ getTypeLabel(selectedFeedback.type) }}
              </Badge>
              <Badge :variant="getStatusVariant(selectedFeedback.status)">
                {{ getStatusLabel(selectedFeedback.status) }}
              </Badge>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ formatDate(selectedFeedback.created_at) }}
            </p>
          </div>
          <div>
            <Label>反馈内容</Label>
            <p class="text-sm mt-1">{{ selectedFeedback.content }}</p>
          </div>
          <div v-if="selectedFeedback.images && selectedFeedback.images.length > 0">
            <Label>截图</Label>
            <div class="grid grid-cols-3 gap-2 mt-1">
              <img
                v-for="(image, index) in selectedFeedback.images"
                :key="index"
                :src="image"
                alt="截图"
                class="w-full aspect-square object-cover rounded-lg border"
              />
            </div>
          </div>
          <div v-if="selectedFeedback.reply">
            <Label>官方回复</Label>
            <div class="mt-1 p-3 bg-accent rounded-lg">
              <p class="text-sm">{{ selectedFeedback.reply }}</p>
              <p class="text-xs text-muted-foreground mt-2">
                {{ formatDate(selectedFeedback.reply_at) }}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFeedbackStore } from '@/stores/feedback'
import { useToast } from '@/components/ui/toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Plus, X, MessageSquare, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const feedbackStore = useFeedbackStore()
const { toast } = useToast()

// 反馈表单
const feedbackForm = ref({
  type: 'feature',
  content: '',
  images: [] as string[],
  contact: ''
})

// 状态
const isSubmitting = ref(false)
const isLoadingHistory = ref(false)
const showDetailDialog = ref(false)
const selectedFeedback = ref<any>(null)

// 历史反馈
const feedbackHistory = computed(() => feedbackStore.history)

// 表单验证
const canSubmit = computed(() => {
  return feedbackForm.value.type && 
         feedbackForm.value.content.trim().length > 0 &&
         feedbackForm.value.content.length <= 500
})

// 处理图片上传
const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  // 检查文件大小（最大5MB）
  if (file.size > 5 * 1024 * 1024) {
    toast({
      title: '图片过大',
      description: '请选择小于5MB的图片',
      variant: 'destructive'
    })
    return
  }

  // 转换为Base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target?.result as string
    feedbackForm.value.images.push(base64)
  }
  reader.readAsDataURL(file)

  // 清空input
  target.value = ''
}

// 移除图片
const removeImage = (index: number) => {
  feedbackForm.value.images.splice(index, 1)
}

// 提交反馈
const submitFeedback = async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true
  try {
    await feedbackStore.submitFeedback({
      type: feedbackForm.value.type,
      content: feedbackForm.value.content,
      images: feedbackForm.value.images,
      contact: feedbackForm.value.contact
    })

    toast({
      title: '提交成功',
      description: '感谢您的反馈，我们会尽快处理'
    })

    // 重置表单
    feedbackForm.value = {
      type: 'feature',
      content: '',
      images: [],
      contact: ''
    }

    // 刷新历史记录
    await loadHistory()
  } catch (error: any) {
    toast({
      title: '提交失败',
      description: error.message || '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    isSubmitting.value = false
  }
}

// 加载历史记录
const loadHistory = async () => {
  isLoadingHistory.value = true
  try {
    await feedbackStore.fetchHistory()
  } catch (error: any) {
    toast({
      title: '加载失败',
      description: error.message || '请稍后重试',
      variant: 'destructive'
    })
  } finally {
    isLoadingHistory.value = false
  }
}

// 查看反馈详情
const viewFeedbackDetail = (feedback: any) => {
  selectedFeedback.value = feedback
  showDetailDialog.value = true
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
      day: '2-digit'
    })
  }
}

// 初始化
onMounted(() => {
  loadHistory()
})
</script>
