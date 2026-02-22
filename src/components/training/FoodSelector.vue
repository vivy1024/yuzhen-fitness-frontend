<template>
  <Sheet v-model:open="isOpen">
    <SheetContent side="bottom" class="h-[70vh] flex flex-col">
      <SheetHeader>
        <SheetTitle>选择食物</SheetTitle>
      </SheetHeader>

      <!-- 搜索 -->
      <div class="flex gap-2 mt-2">
        <Input v-model="searchQuery" placeholder="搜索食物..." class="flex-1" @input="debouncedSearch" />
        <Select v-model="selectedCategory">
          <SelectTrigger class="w-28">
            <SelectValue placeholder="分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- 食物列表 -->
      <ScrollArea class="flex-1 mt-3">
        <div v-if="loading" class="py-8 text-center text-sm text-muted-foreground">加载中...</div>
        <div v-else-if="foods.length === 0" class="py-8 text-center text-sm text-muted-foreground">
          {{ searchQuery ? '未找到匹配食物' : '请搜索食物' }}
        </div>
        <div v-else class="space-y-1">
          <button
            v-for="food in foods"
            :key="food.id"
            class="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-accent text-left transition-colors"
            :class="{ 'bg-primary/10 ring-1 ring-primary/30': isSelected(food.id) }"
            @click="toggleSelect(food)"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium truncate">{{ food.name }}</p>
              <p class="text-xs text-muted-foreground">{{ food.category }}</p>
            </div>
            <div class="text-right ml-3 shrink-0">
              <p class="text-xs font-medium">{{ food.energy_kcal ?? '-' }} kcal</p>
              <p class="text-[10px] text-muted-foreground">
                蛋白{{ food.protein ?? '-' }}g · 碳水{{ food.carbohydrate ?? '-' }}g · 脂肪{{ food.fat ?? '-' }}g
              </p>
            </div>
          </button>
        </div>
      </ScrollArea>

      <!-- 底部操作 -->
      <div class="flex items-center justify-between pt-3 border-t">
        <span class="text-sm text-muted-foreground">已选 {{ selected.length }} 项</span>
        <Button :disabled="selected.length === 0" @click="handleConfirm">确认添加</Button>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { foodApi, type FoodBasic } from '@/api/food'

const isOpen = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  confirm: [foods: FoodBasic[]]
}>()

const searchQuery = ref('')
const selectedCategory = ref('all')
const foods = ref<FoodBasic[]>([])
const selected = ref<FoodBasic[]>([])
const loading = ref(false)
const categories = ['谷类', '薯类', '蔬菜', '水果', '畜肉', '禽肉', '水产', '蛋类', '奶类', '豆类', '坚果']

let searchTimer: ReturnType<typeof setTimeout>

function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchFoods, 300)
}

async function fetchFoods() {
  if (!searchQuery.value && selectedCategory.value === 'all') {
    foods.value = []
    return
  }
  loading.value = true
  try {
    const res = await foodApi.getList({
      search: searchQuery.value || undefined,
      category: selectedCategory.value === 'all' ? undefined : selectedCategory.value,
      per_page: 30,
    })
    foods.value = res.data?.data || []
  } catch {
    foods.value = []
  } finally {
    loading.value = false
  }
}

function isSelected(id: number) {
  return selected.value.some(f => f.id === id)
}

function toggleSelect(food: FoodBasic) {
  const idx = selected.value.findIndex(f => f.id === food.id)
  if (idx >= 0) {
    selected.value.splice(idx, 1)
  } else {
    selected.value.push(food)
  }
}

function handleConfirm() {
  emit('confirm', [...selected.value])
  selected.value = []
  isOpen.value = false
}

watch(selectedCategory, fetchFoods)
watch(isOpen, (open) => {
  if (open) {
    selected.value = []
    searchQuery.value = ''
    foods.value = []
  }
})
</script>
