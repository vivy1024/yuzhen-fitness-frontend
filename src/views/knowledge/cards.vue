<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="container mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="icon" @click="router.back()">
            <ChevronLeft class="h-5 w-5" />
          </Button>
          <h1 class="text-lg font-semibold">知识卡片</h1>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground">
            {{ currentIndex + 1 }} / {{ cards.length }}
          </span>
          <Button variant="ghost" size="icon" @click="refreshCards">
            <RefreshCw class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>

    <!-- 分类筛选 -->
    <div class="container mx-auto px-4 py-3">
      <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Button
          variant="outline"
          size="sm"
          :class="selectedCategoryId === null ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''"
          @click="selectCategory(null)"
        >
          随机
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

    <!-- 骨架屏 -->
    <div v-if="loading" class="flex items-center justify-center" style="height: calc(100vh - 140px)">
      <div class="w-full max-w-sm px-4 space-y-4">
        <Skeleton class="h-6 w-2/3" />
        <Skeleton class="h-4 w-1/3" />
        <Skeleton class="h-20 w-full" />
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-10 w-full" />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="cards.length === 0" class="flex flex-col items-center justify-center" style="height: calc(100vh - 140px)">
      <BookOpen class="h-12 w-12 text-muted-foreground mb-3" />
      <p class="text-muted-foreground">暂无知识卡片</p>
      <Button variant="outline" class="mt-4" @click="refreshCards">刷新试试</Button>
    </div>

    <!-- 卡片滑动区域 -->
    <div
      v-else
      ref="scrollContainer"
      class="snap-x snap-mandatory overflow-x-auto flex scrollbar-hide"
      style="height: calc(100vh - 140px)"
      @scroll="onScroll"
    >
      <div
        v-for="(card, index) in cards"
        :key="card.id"
        class="snap-center shrink-0 w-full"
      >
        <KnowledgeCard
          :article="card"
          @detail="goToDetail"
        />
      </div>
    </div>

    <!-- 底部指示器 -->
    <div v-if="cards.length > 0" class="fixed bottom-6 left-0 right-0 flex justify-center gap-1.5">
      <div
        v-for="(_, index) in cards"
        :key="index"
        class="h-1.5 rounded-full transition-all duration-300"
        :class="index === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, RefreshCw, BookOpen } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import KnowledgeCard from '@/components/knowledge/KnowledgeCard.vue'
import {
  getKnowledgeCards,
  getKnowledgeCategories,
  type KnowledgeArticle,
  type KnowledgeCategory,
} from '@/api/knowledge'

const router = useRouter()
const { toast } = useToast()

const loading = ref(false)
const cards = ref<KnowledgeArticle[]>([])
const categories = ref<KnowledgeCategory[]>([])
const selectedCategoryId = ref<number | null>(null)
const currentIndex = ref(0)
const scrollContainer = ref<HTMLElement | null>(null)

const fetchCards = async () => {
  loading.value = true
  try {
    const res = await getKnowledgeCards({
      count: 10,
      category_id: selectedCategoryId.value ?? undefined,
    })
    if (res.code === 200 && res.data) {
      cards.value = res.data
      currentIndex.value = 0
    } else {
      toast({ title: '加载失败', description: res.msg, variant: 'destructive' })
    }
  } catch {
    toast({ title: '加载失败', description: '网络错误', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

const refreshCards = () => {
  if (scrollContainer.value) scrollContainer.value.scrollLeft = 0
  fetchCards()
}

const selectCategory = (id: number | null) => {
  selectedCategoryId.value = id
  refreshCards()
}

const onScroll = () => {
  if (!scrollContainer.value) return
  const el = scrollContainer.value
  const cardWidth = el.clientWidth
  if (cardWidth > 0) {
    currentIndex.value = Math.round(el.scrollLeft / cardWidth)
  }
}

const goToDetail = (id: number) => {
  router.push(`/knowledge/${id}`)
}

onMounted(async () => {
  const catRes = await getKnowledgeCategories()
  if (catRes.code === 200) categories.value = catRes.data
  await fetchCards()
})
</script>
