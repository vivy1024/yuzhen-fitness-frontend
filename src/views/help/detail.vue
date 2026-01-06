<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="container mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" @click="router.back()">
            <ChevronLeft class="h-5 w-5" />
          </Button>
          <h1 class="text-lg font-semibold">问题详情</h1>
        </div>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="container mx-auto px-4 py-6">
      <Skeleton class="h-8 w-3/4 mb-4" />
      <Skeleton class="h-4 w-1/4 mb-6" />
      <Skeleton class="h-32 w-full mb-6" />
      <Skeleton class="h-24 w-full" />
    </div>

    <!-- 问题详情 -->
    <div v-else-if="faq" class="container mx-auto px-4 py-6">
      <!-- 问题标题 -->
      <div class="mb-6">
        <Badge variant="secondary" class="mb-3">
          {{ getCategoryLabel(faq.category) }}
        </Badge>
        <h2 class="text-xl font-bold mb-2">{{ faq.question }}</h2>
        <p class="text-sm text-muted-foreground">
          更新时间：{{ formatDate(faq.updated_at) }}
        </p>
      </div>

      <!-- 问题解答 -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle class="text-base">解答</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="prose prose-sm max-w-none" v-html="formattedAnswer"></div>
        </CardContent>
      </Card>

      <!-- 是否有帮助 -->
      <Card class="mb-6">
        <CardContent class="pt-6">
          <p class="text-sm font-medium mb-4 text-center">这个回答对您有帮助吗？</p>
          <div class="flex gap-3 justify-center">
            <Button
              :variant="feedback === 'helpful' ? 'default' : 'outline'"
              @click="submitFeedback('helpful')"
              :disabled="feedbackSubmitted"
            >
              <ThumbsUp class="h-4 w-4 mr-2" />
              有帮助
            </Button>
            <Button
              :variant="feedback === 'not_helpful' ? 'default' : 'outline'"
              @click="submitFeedback('not_helpful')"
              :disabled="feedbackSubmitted"
            >
              <ThumbsDown class="h-4 w-4 mr-2" />
              没帮助
            </Button>
          </div>
          <p v-if="feedbackSubmitted" class="text-sm text-muted-foreground text-center mt-3">
            感谢您的反馈！
          </p>
        </CardContent>
      </Card>

      <!-- 相关问题推荐 -->
      <div v-if="relatedFaqs.length > 0">
        <h3 class="text-base font-semibold mb-3">相关问题</h3>
        <div class="space-y-3">
          <Card
            v-for="related in relatedFaqs"
            :key="related.id"
            class="cursor-pointer hover:shadow-md transition-shadow"
            @click="viewRelated(related.id)"
          >
            <CardHeader class="pb-3">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <Badge variant="outline" class="mb-2">
                    {{ getCategoryLabel(related.category) }}
                  </Badge>
                  <CardTitle class="text-sm">{{ related.question }}</CardTitle>
                </div>
                <ChevronRight class="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="container mx-auto px-4 py-12 text-center">
      <HelpCircle class="h-12 w-12 mx-auto text-muted-foreground mb-3" />
      <p class="text-muted-foreground">问题不存在或已被删除</p>
      <Button class="mt-4" @click="router.push('/help')">
        返回帮助中心
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, HelpCircle, ThumbsUp, ThumbsDown } from 'lucide-vue-next'
import { getFaqDetail, submitFaqFeedback, type FAQ } from '@/api/help'
import { useToast } from '@/components/ui/toast'

const router = useRouter()
const route = useRoute()
const { toast } = useToast()

// 状态
const loading = ref(false)
const faq = ref<FAQ | null>(null)
const relatedFaqs = ref<FAQ[]>([])
const feedback = ref<'helpful' | 'not_helpful' | null>(null)
const feedbackSubmitted = ref(false)

// 分类选项
const categories = [
  { label: '账号', value: 'account' },
  { label: '训练', value: 'training' },
  { label: '会员', value: 'membership' },
  { label: '技术', value: 'technical' }
]

// 获取分类标签
const getCategoryLabel = (category: string) => {
  return categories.find(c => c.value === category)?.label || category
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 格式化答案（支持换行和简单HTML）
const formattedAnswer = computed(() => {
  if (!faq.value) return ''
  return faq.value.answer
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
})

// 加载FAQ详情
const loadFaqDetail = async () => {
  const faqId = route.params.id as string
  if (!faqId) {
    router.push('/help')
    return
  }

  loading.value = true
  try {
    const response = await getFaqDetail(faqId)
    if (response.code === 200) {
      faq.value = response.data.faq
      relatedFaqs.value = response.data.related || []
    } else {
      toast({
        title: '加载失败',
        description: response.msg || '无法加载问题详情',
        variant: 'destructive'
      })
    }
  } catch (error) {
    console.error('加载FAQ详情失败:', error)
    toast({
      title: '加载失败',
      description: '网络错误，请稍后重试',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

// 提交反馈
const submitFeedback = async (type: 'helpful' | 'not_helpful') => {
  if (!faq.value || feedbackSubmitted.value) return

  feedback.value = type
  feedbackSubmitted.value = true

  try {
    const response = await submitFaqFeedback(faq.value.id, type === 'helpful')
    if (response.code === 200) {
      toast({
        title: '感谢反馈',
        description: '您的反馈将帮助我们改进服务'
      })
    }
  } catch (error) {
    console.error('提交反馈失败:', error)
    // 静默失败，不影响用户体验
  }
}

// 查看相关问题
const viewRelated = (faqId: string) => {
  router.push(`/help/${faqId}`)
  // 重新加载详情
  loadFaqDetail()
}

// 初始化
onMounted(() => {
  loadFaqDetail()
})
</script>

<style scoped>
.prose {
  color: hsl(var(--foreground));
}

.prose strong {
  font-weight: 600;
  color: hsl(var(--foreground));
}
</style>
