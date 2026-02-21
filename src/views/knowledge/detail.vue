<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-10 bg-background border-b">
      <div class="container mx-auto px-4 h-14 flex items-center gap-3">
        <Button variant="ghost" size="icon" @click="router.back()">
          <ChevronLeft class="h-5 w-5" />
        </Button>
        <h1 class="text-base font-semibold truncate flex-1">{{ article?.title || '知识详情' }}</h1>
      </div>
    </header>

    <!-- 骨架屏 -->
    <div v-if="loading" class="container mx-auto px-4 py-6 space-y-4">
      <Skeleton class="h-8 w-3/4" />
      <Skeleton class="h-4 w-1/3" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-2/3" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="container mx-auto px-4 py-16 text-center">
      <AlertCircle class="h-12 w-12 mx-auto text-destructive mb-3" />
      <p class="text-muted-foreground mb-4">{{ error }}</p>
      <Button variant="outline" @click="fetchDetail">重新加载</Button>
    </div>

    <!-- 文章内容 -->
    <template v-else-if="article">
      <div class="container mx-auto px-4 py-6">
        <!-- 标题区 -->
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-3">
            <Badge>{{ article.category.name }}</Badge>
            <span class="text-xs text-muted-foreground">{{ article.source_name }}</span>
          </div>
          <h2 class="text-xl font-bold leading-snug mb-3">{{ article.title }}</h2>
          <p class="text-sm text-muted-foreground">{{ article.summary }}</p>
          <div v-if="article.tags?.length" class="flex gap-1 mt-3 flex-wrap">
            <Badge v-for="tag in article.tags" :key="tag" variant="outline" class="text-xs">
              {{ tag }}
            </Badge>
          </div>
        </div>

        <Separator class="mb-6" />

        <!-- 正文 -->
        <div
          class="prose prose-sm max-w-none text-foreground
            prose-headings:text-foreground prose-headings:font-semibold
            prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-strong:text-foreground
            prose-li:text-muted-foreground
            prose-a:text-primary"
          v-html="renderedContent"
        />

        <!-- 引用来源 -->
        <template v-if="article.references?.length">
          <Separator class="my-6" />
          <div>
            <h3 class="text-sm font-semibold mb-3 text-muted-foreground">参考来源</h3>
            <ul class="space-y-2">
              <li
                v-for="(ref, i) in article.references"
                :key="i"
                class="text-sm text-muted-foreground flex items-start gap-2"
              >
                <span class="shrink-0 text-xs bg-muted rounded px-1 py-0.5 mt-0.5">{{ i + 1 }}</span>
                <span>{{ ref.title }}<span v-if="ref.source"> · {{ ref.source }}</span></span>
              </li>
            </ul>
          </div>
        </template>

        <!-- 相关推荐 -->
        <template v-if="article.related?.length">
          <Separator class="my-6" />
          <div>
            <h3 class="text-sm font-semibold mb-3">相关推荐</h3>
            <div class="space-y-3">
              <Card
                v-for="rel in article.related"
                :key="rel.id"
                class="cursor-pointer hover:shadow-md transition-shadow"
                @click="router.push(`/knowledge/${rel.id}`)"
              >
                <CardHeader class="py-3">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <Badge variant="secondary" class="text-xs mb-1">{{ rel.category.name }}</Badge>
                      <CardTitle class="text-sm leading-snug">{{ rel.title }}</CardTitle>
                    </div>
                    <ChevronRight class="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { marked } from 'marked'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import { getKnowledgeDetail, type KnowledgeDetail } from '@/api/knowledge'

const router = useRouter()
const route = useRoute()
const { toast } = useToast()

const loading = ref(false)
const error = ref('')
const article = ref<KnowledgeDetail | null>(null)

const renderedContent = computed(() => {
  if (!article.value?.content) return ''
  return marked(article.value.content) as string
})

const fetchDetail = async () => {
  const id = Number(route.params.id)
  if (!id) {
    error.value = '无效的文章 ID'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const res = await getKnowledgeDetail(id)
    if (res.code === 200 && res.data) {
      article.value = res.data
    } else {
      error.value = res.msg || '加载失败'
      toast({ title: '加载失败', description: res.msg, variant: 'destructive' })
    }
  } catch {
    error.value = '网络错误，请稍后重试'
    toast({ title: '加载失败', description: '网络错误，请稍后重试', variant: 'destructive' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
</script>
