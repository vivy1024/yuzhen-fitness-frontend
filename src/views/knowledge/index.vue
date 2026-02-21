<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="container mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" @click="router.back()">
            <ChevronLeft class="h-5 w-5" />
          </Button>
          <h1 class="text-lg font-semibold">知识库</h1>
        </div>
        <Button variant="ghost" size="sm" @click="router.push('/knowledge/cards')">
          <Layers class="h-4 w-4 mr-1" />
          卡片
        </Button>
      </div>
    </header>

    <!-- 搜索框 -->
    <div class="container mx-auto px-4 py-4">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="搜索健身知识..."
          class="pl-9"
          @keyup.enter="handleSearch"
        />
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="container mx-auto px-4 pb-4">
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant="outline"
          size="sm"
          :class="selectedCategoryId === null ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''"
          @click="selectCategory(null)"
        >
          全部
        </Button>
        <Button
          v-for="cat in categories"
          :key="cat.id"
          variant="outline"
          size="sm"
          :class="selectedCategoryId === cat.id ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''"
          @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </Button>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="container mx-auto px-4 pb-6 space-y-3">
      <!-- 骨架屏 -->
      <template v-if="loading && articles.length === 0">
        <Skeleton v-for="i in 5" :key="i" class="h-28 w-full rounded-lg" />
      </template>

      <!-- 空状态 -->
      <div v-else-if="!loading && articles.length === 0" class="text-center py-16">
        <BookOpen class="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p class="text-muted-foreground">暂无相关文章</p>
      </div>

      <!-- 文章卡片 -->
      <Card
        v-for="article in articles"
        :key="article.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="router.push(`/knowledge/${article.id}`)"
      >
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <Badge variant="secondary" class="text-xs shrink-0">{{ article.category.name }}</Badge>
                <span class="text-xs text-muted-foreground truncate">{{ article.source_name }}</span>
              </div>
              <CardTitle class="text-base leading-snug">{{ article.title }}</CardTitle>
            </div>
            <ChevronRight class="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          </div>
        </CardHeader>
        <CardContent class="pt-0">
          <p class="text-sm text-muted-foreground line-clamp-2">{{ article.summary }}</p>
          <div v-if="article.tags?.length" class="flex gap-1 mt-2 flex-wrap">
            <Badge
              v-for="tag in article.tags.slice(0, 3)"
              :key="tag"
              variant="outline"
              class="text-xs"
            >
              {{ tag }}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <!-- 加载更多触发器 -->
      <div ref="loadMoreRef" class="h-4" />

      <!-- 底部加载状态 -->
      <div v-if="loadingMore" class="flex justify-center py-4">
        <Skeleton class="h-8 w-24 rounded-full" />
      </div>

      <!-- 已加载全部 -->
      <p v-if="!hasMore && articles.length > 0" class="text-center text-xs text-muted-foreground py-4">
        已加载全部内容
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Search, BookOpen, Layers } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import {
  getKnowledgeList,
  getKnowledgeCategories,
  searchKnowledge,
  type KnowledgeArticle,
  type KnowledgeCategory
} from '@/api/knowledge'

const router = useRouter()
const route = useRoute()
const { toast } = useToast()

const loading = ref(false)
const loadingMore = ref(false)
const articles = ref<KnowledgeArticle[]>([])
const categories = ref<KnowledgeCategory[]>([])
const selectedCategoryId = ref<number | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const hasMore = ref(true)
const loadMoreRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const fetchArticles = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    articles.value = []
    hasMore.value = true
  }
  if (!hasMore.value) return

  const isFirstLoad = currentPage.value === 1
  if (isFirstLoad) loading.value = true
  else loadingMore.value = true

  try {
    const params = {
      page: currentPage.value,
      per_page: 10,
      category_id: selectedCategoryId.value ?? undefined
    }
    const res = await getKnowledgeList(params)
    if (res.code === 200 && res.data) {
      articles.value.push(...res.data.items)
      hasMore.value = currentPage.value < res.data.pagination.last_page
      currentPage.value++
    } else {
      toast({ title: '加载失败', description: res.msg, variant: 'destructive' })
    }
  } catch {
    toast({ title: '加载失败', description: '网络错误，请稍后重试', variant: 'destructive' })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const handleSearch = async () => {
  const q = searchQuery.value.trim()
  if (!q) {
    fetchArticles(true)
    return
  }
  loading.value = true
  articles.value = []
  hasMore.value = false
  try {
    const res = await searchKnowledge({ q, page: 1, per_page: 20 })
    if (res.code === 200 && res.data) {
      articles.value = res.data.items
    } else {
      toast({ title: '搜索失败', description: res.msg, variant: 'destructive' })
    }
  } catch {
    toast({ title: '搜索失败', description: '网络错误，请稍后重试', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

const selectCategory = (id: number | null) => {
  selectedCategoryId.value = id
  searchQuery.value = ''
  fetchArticles(true)
}

const setupObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loadingMore.value && !loading.value) {
        fetchArticles()
      }
    },
    { threshold: 0.1 }
  )
  if (loadMoreRef.value) observer.observe(loadMoreRef.value)
}

watch(loadMoreRef, (el) => {
  if (el && observer) observer.observe(el)
})

onMounted(async () => {
  const catRes = await getKnowledgeCategories()
  if (catRes.code === 200) categories.value = catRes.data

  // 支持 URL ?search= 参数（从AI引用点击跳转）
  const q = route.query.search as string
  if (q) {
    searchQuery.value = q
    await handleSearch()
  } else {
    await fetchArticles()
  }
  setupObserver()
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>
