<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-lg max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>选择训练动作</DialogTitle>
        <DialogDescription>搜索并选择要添加到计划中的动作</DialogDescription>
      </DialogHeader>

      <!-- 搜索框 -->
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="搜索动作名称..."
            class="pl-9"
            @input="debouncedSearch"
          />
        </div>
        <Select v-model="muscleFilter">
          <SelectTrigger class="w-28">
            <SelectValue placeholder="肌群" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部肌群</SelectItem>
            <SelectItem v-for="m in muscleGroups" :key="m" :value="m">{{ m }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- 已选动作预览 -->
      <div v-if="selected.length > 0" class="flex flex-wrap gap-1.5">
        <Badge
          v-for="ex in selected"
          :key="ex.id"
          variant="secondary"
          class="cursor-pointer gap-1"
          @click="toggleSelect(ex)"
        >
          {{ ex.name_zh }}
          <X class="w-3 h-3" />
        </Badge>
      </div>

      <!-- 动作列表 -->
      <ScrollArea class="flex-1 min-h-0">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <Loader2 class="w-5 h-5 animate-spin text-primary" />
          <span class="ml-2 text-sm text-muted-foreground">搜索中...</span>
        </div>

        <div v-else-if="exercises.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          {{ searchQuery ? '未找到匹配的动作' : '输入关键词搜索动作' }}
        </div>

        <div v-else class="space-y-1">
          <div
            v-for="ex in exercises"
            :key="ex.id"
            class="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors"
            :class="isSelected(ex.id) ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'"
            @click="toggleSelect(ex)"
          >
            <Checkbox :checked="isSelected(ex.id)" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">{{ ex.name_zh }}</div>
              <div class="text-xs text-muted-foreground">
                {{ ex.muscles_primary?.join('、') || '未知肌群' }}
                <span v-if="ex.equipment" class="ml-2">· {{ ex.equipment }}</span>
              </div>
            </div>
            <Badge variant="outline" class="text-[10px] shrink-0">
              {{ ex.difficulty_zh || '中级' }}
            </Badge>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore" class="py-3 text-center">
          <Button variant="ghost" size="sm" :disabled="loading" @click="loadMore">
            加载更多
          </Button>
        </div>
      </ScrollArea>

      <!-- 底部操作 -->
      <div class="flex items-center justify-between pt-2 border-t">
        <span class="text-sm text-muted-foreground">已选 {{ selected.length }} 个动作</span>
        <div class="flex gap-2">
          <Button variant="outline" @click="isOpen = false">取消</Button>
          <Button :disabled="selected.length === 0" @click="handleConfirm">
            确认添加
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, X, Loader2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { exerciseApi } from '@/api/exercise'
import type { ExerciseBasic } from '@/types/exercise'

const isOpen = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  (e: 'confirm', exercises: ExerciseBasic[]): void
}>()

const searchQuery = ref('')
const muscleFilter = ref('all')
const exercises = ref<ExerciseBasic[]>([])
const selected = ref<ExerciseBasic[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(false)

const muscleGroups = [
  '胸', '背', '肩', '二头肌', '三头肌', '前臂',
  '腹', '股四头肌', '腘绳肌', '臀', '小腿',
]

let searchTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchExercises()
  }, 300)
}

async function fetchExercises() {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: 30 }
    if (searchQuery.value) params.search = searchQuery.value
    if (muscleFilter.value && muscleFilter.value !== 'all') params.muscle = muscleFilter.value

    const res = await exerciseApi.getList(params)
    if (res.code === 200 && res.data) {
      if (page.value === 1) {
        exercises.value = res.data.items
      } else {
        exercises.value.push(...res.data.items)
      }
      hasMore.value = res.data.pagination.current < res.data.pagination.totalPages
    }
  } finally {
    loading.value = false
  }
}

function loadMore() {
  page.value++
  fetchExercises()
}

function isSelected(id: number): boolean {
  return selected.value.some(e => e.id === id)
}

function toggleSelect(ex: ExerciseBasic) {
  const idx = selected.value.findIndex(e => e.id === ex.id)
  if (idx >= 0) {
    selected.value.splice(idx, 1)
  } else {
    selected.value.push(ex)
  }
}

function handleConfirm() {
  emit('confirm', [...selected.value])
  selected.value = []
  isOpen.value = false
}

watch(muscleFilter, () => {
  page.value = 1
  fetchExercises()
})

watch(isOpen, (val) => {
  if (val && exercises.value.length === 0) {
    fetchExercises()
  }
})
</script>
