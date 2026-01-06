<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="container mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" @click="router.back()">
            <ChevronLeft class="h-5 w-5" />
          </Button>
          <h1 class="text-lg font-semibold">帮助中心</h1>
        </div>
      </div>
    </header>

    <!-- 搜索栏 -->
    <div class="container mx-auto px-4 py-4">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="搜索问题..."
          class="pl-9"
          @input="handleSearch"
        />
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="container mx-auto px-4 pb-4">
      <div class="flex gap-2 overflow-x-auto pb-2">
        <Button
          v-for="category in categories"
          :key="category.value"
          :variant="selectedCategory === category.value ? 'default' : 'outline'"
          size="sm"
          @click="selectCategory(category.value)"
        >
          {{ category.label }}
        </Button>
      </div>
    </div>

    <!-- FAQ列表 -->
    <div class="container mx-auto px-4 pb-6">
      <div v-if="loading" class="space-y-3">
        <Skeleton v-for="i in 5" :key="i" class="h-16 w-full" />
      </div>

      <div v-else-if="filteredFaqs.length === 0" class="text-center py-12">
        <HelpCircle class="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p class="text-muted-foreground">没有找到相关问题</p>
      </div>

      <div v-else class="space-y-3">
        <Card
          v-for="faq in filteredFaqs"
          :key="faq.id"
          class="cursor-pointer hover:shadow-md transition-shadow"
          @click="viewDetail(faq.id)"
        >
          <CardHeader class="pb-3">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1">
                <Badge variant="secondary" class="mb-2">
                  {{ getCategoryLabel(faq.category) }}
                </Badge>
                <CardTitle class="text-base">{{ faq.question }}</CardTitle>
              </div>
              <ChevronRight class="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
          </CardHeader>
          <CardContent v-if="expandedFaqId === faq.id" class="pt-0">
            <Separator class="mb-3" />
            <p class="text-sm text-muted-foreground line-clamp-3">
              {{ faq.answer }}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ChevronRight, Search, HelpCircle } from 'lucide-vue-next'
import { getFaqs, type FAQ } from '@/api/help'
import { useToast } from '@/components/ui/toast'

const router = useRouter()
const { toast } = useToast()

// 状态
const loading = ref(false)
const faqs = ref<FAQ[]>([])
const searchQuery = ref('')
const selectedCategory = ref<string>('all')
const expandedFaqId = ref<string | null>(null)

// 分类选项
const categories = [
  { label: '全部', value: 'all' },
  { label: '账号', value: 'account' },
  { label: '训练', value: 'training' },
  { label: '会员', value: 'membership' },
  { label: '技术', value: 'technical' }
]

// 获取分类标签
const getCategoryLabel = (category: string) => {
  return categories.find(c => c.value === category)?.label || category
}

// 筛选后的FAQ列表
const filteredFaqs = computed(() => {
  let result = faqs.value

  // 按分类筛选
  if (selectedCategory.value !== 'all') {
    result = result.filter(faq => faq.category === selectedCategory.value)
  }

  // 按关键词搜索
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(faq =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query)
    )
  }

  return result
})

// 加载FAQ列表
const loadFaqs = async () => {
  loading.value = true
  try {
    const response = await getFaqs()
    if (response.code === 200) {
      faqs.value = response.data
    } else {
      toast({
        title: '加载失败',
        description: response.msg || '无法加载FAQ列表',
        variant: 'destructive'
      })
    }
  } catch (error) {
    console.error('加载FAQ失败:', error)
    toast({
      title: '加载失败',
      description: '网络错误，请稍后重试',
      variant: 'destructive'
    })
  } finally {
    loading.value = false
  }
}

// 选择分类
const selectCategory = (category: string) => {
  selectedCategory.value = category
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑已在computed中处理
}

// 查看详情
const viewDetail = (faqId: string) => {
  router.push(`/help/${faqId}`)
}

// 初始化
onMounted(() => {
  loadFaqs()
})
</script>
