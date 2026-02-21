<template>
  <div class="w-full h-full flex items-center justify-center p-4">
    <Card class="w-full max-w-sm shadow-lg">
      <CardHeader class="pb-3">
        <div class="flex items-center gap-2 mb-2">
          <Badge>{{ article.category?.name || '知识' }}</Badge>
          <Badge v-if="article.difficulty" variant="outline" class="text-xs">
            {{ difficultyLabel }}
          </Badge>
        </div>
        <CardTitle class="text-lg leading-snug">{{ article.title }}</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground leading-relaxed mb-4">
          {{ article.summary }}
        </p>
        <div v-if="article.tags?.length" class="flex gap-1 flex-wrap mb-4">
          <Badge
            v-for="tag in article.tags.slice(0, 4)"
            :key="tag"
            variant="secondary"
            class="text-xs"
          >
            {{ tag }}
          </Badge>
        </div>
        <Separator class="mb-3" />
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span v-if="article.source_book">📖 {{ article.source_book }}</span>
          <span v-if="article.view_count">👁 {{ article.view_count }}</span>
        </div>
      </CardContent>
      <CardFooter class="pt-0">
        <Button class="w-full" variant="outline" @click="$emit('detail', article.id)">
          阅读全文
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { KnowledgeArticle } from '@/api/knowledge'

const props = defineProps<{ article: KnowledgeArticle }>()
defineEmits<{ detail: [id: number] }>()

const difficultyLabel = computed(() => {
  const map: Record<string, string> = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级',
  }
  return map[props.article.difficulty ?? ''] ?? ''
})
</script>
