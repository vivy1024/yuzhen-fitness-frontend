<template>
  <div class="food-library min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b">
      <div class="flex items-center justify-between px-4 h-14">
        <Button variant="ghost" size="icon" @click="router.back()">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <h1 class="text-lg font-semibold">食物库</h1>
        <span class="text-sm text-gray-500">{{ foodStore.totalCount }} 食物</span>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="pb-24">
      <!-- 搜索框 -->
      <div class="p-4 bg-white border-b">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            v-model="searchKeyword"
            placeholder="搜索食物名称..."
            class="pl-10 h-10 rounded-full bg-gray-100 border-0"
            @keyup.enter="handleSearch"
          />
          <Button
            v-if="searchKeyword"
            variant="ghost"
            size="icon"
            class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            @click="handleClearSearch"
          >
            <X class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <!-- 分类选择器 -->
      <div class="px-4 py-3 bg-white border-b overflow-x-auto">
        <div class="flex gap-2 min-w-max">
          <Button
            :variant="!selectedCategory ? 'default' : 'outline'"
            size="sm"
            class="rounded-full"
            @click="handleCategoryChange(undefined)"
          >
            全部
          </Button>
          <Button
            v-for="category in foodStore.categories"
            :key="category.name"
            :variant="selectedCategory === category.name ? 'default' : 'outline'"
            size="sm"
            class="rounded-full whitespace-nowrap"
            @click="handleCategoryChange(category.name)"
          >
            {{ category.name }} ({{ category.count }})
          </Button>
        </div>
      </div>

      <!-- 高级筛选 -->
      <Collapsible v-model:open="filterOpen" class="mx-4 my-4">
        <CollapsibleTrigger as-child>
          <Button variant="outline" class="w-full justify-between">
            <div class="flex items-center gap-2">
              <Filter class="w-4 h-4" />
              <span>高级筛选</span>
              <Badge v-if="activeFilterCount > 0" class="ml-1">
                {{ activeFilterCount }}
              </Badge>
            </div>
            <ChevronDown :class="['w-4 h-4 transition-transform', filterOpen && 'rotate-180']" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent class="mt-3 space-y-4 bg-white rounded-lg p-4 shadow-sm">
          <!-- GI值筛选 -->
          <div>
            <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp class="w-4 h-4" />
              GI值（升糖指数）
            </h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in giOptions" :key="item.value" class="flex items-center">
                <Checkbox
                  :id="`gi-${item.value}`"
                  :checked="currentFilters.gi?.includes(item.value)"
                  @update:model-value="(checked) => toggleFilter('gi', item.value, checked)"
                />
                <label :for="`gi-${item.value}`" class="ml-2 text-sm">
                  <Badge :class="item.color">{{ item.label }}</Badge>
                </label>
              </div>
            </div>
          </div>

          <!-- 热量范围 -->
          <div>
            <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
              <Flame class="w-4 h-4" />
              热量范围
            </h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in calorieOptions" :key="item.value" class="flex items-center">
                <Checkbox
                  :id="`cal-${item.value}`"
                  :checked="currentFilters.calorie?.includes(item.value)"
                  @update:model-value="(checked) => toggleFilter('calorie', item.value, checked)"
                />
                <label :for="`cal-${item.value}`" class="ml-2 text-sm">{{ item.label }}</label>
              </div>
            </div>
          </div>

          <!-- 蛋白质含量 -->
          <div>
            <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
              <Beef class="w-4 h-4" />
              蛋白质含量
            </h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in proteinOptions" :key="item.value" class="flex items-center">
                <Checkbox
                  :id="`protein-${item.value}`"
                  :checked="currentFilters.protein?.includes(item.value)"
                  @update:model-value="(checked) => toggleFilter('protein', item.value, checked)"
                />
                <label :for="`protein-${item.value}`" class="ml-2 text-sm">{{ item.label }}</label>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-3 pt-2">
            <Button variant="outline" class="flex-1" @click="handleFilterReset">
              重置
            </Button>
            <Button class="flex-1" @click="handleFilterApply">
              应用筛选
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <!-- 骨架屏加载 -->
      <div v-if="isInitialLoading" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 px-3">
        <div v-for="i in 12" :key="i" class="bg-white rounded-lg overflow-hidden">
          <Skeleton class="w-full pb-[65%]" />
          <div class="p-1.5 space-y-1">
            <Skeleton class="h-3 w-3/4" />
            <Skeleton class="h-2 w-1/2" />
          </div>
        </div>
      </div>

      <!-- 食物列表 -->
      <div v-else-if="foodStore.foods.length > 0" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 px-3">
        <FoodCard
          v-for="food in foodStore.foods"
          :key="food.id"
          :food="food"
          :is-favorited="foodStore.isFavorite(food.id)"
          @card-click="handleCardClick"
          @favorite="handleToggleFavorite"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center py-16 px-4">
        <Search class="w-16 h-16 text-gray-300 mb-4" />
        <p class="text-gray-500 mb-4">{{ getEmptyDescription() }}</p>
        <Button @click="handleResetAll">重置筛选</Button>
      </div>

      <!-- 分页 -->
      <div v-if="foodStore.pagination.totalPages > 1" class="px-4 py-6 space-y-4">
        <div class="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            :disabled="foodStore.pagination.current === 1"
            @click="handlePageChange(1)"
          >
            <ChevronsLeft class="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            :disabled="foodStore.pagination.current === 1"
            @click="handlePageChange(foodStore.pagination.current - 1)"
          >
            <ChevronLeft class="w-4 h-4" />
          </Button>
          
          <span class="px-4 text-sm">
            {{ foodStore.pagination.current }} / {{ foodStore.pagination.totalPages }}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            :disabled="foodStore.pagination.current === foodStore.pagination.totalPages"
            @click="handlePageChange(foodStore.pagination.current + 1)"
          >
            <ChevronRight class="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            :disabled="foodStore.pagination.current === foodStore.pagination.totalPages"
            @click="handlePageChange(foodStore.pagination.totalPages)"
          >
            <ChevronsRight class="w-4 h-4" />
          </Button>
        </div>

        <!-- 页面跳转 -->
        <div class="flex items-center justify-center gap-2">
          <span class="text-sm text-gray-500">跳转到</span>
          <Input
            v-model.number="jumpPageInput"
            type="number"
            class="w-16 h-8 text-center"
            @keyup.enter="handlePageJump"
          />
          <Button size="sm" @click="handlePageJump">GO</Button>
        </div>

        <div class="text-center text-sm text-gray-500">
          共 {{ foodStore.pagination.total }} 种食物
        </div>
      </div>

      <!-- 数据来源说明 -->
      <div class="mx-4 mb-4 text-center text-xs text-gray-400">
        数据来源：《中国食物成分表》
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Search, X, Filter, ChevronDown, TrendingUp, Flame, Beef,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useToast } from '@/components/ui/toast'
import { useFoodStore } from '@/stores/food'
import FoodCard from '@/components/food/FoodCard.vue'

const router = useRouter()
const foodStore = useFoodStore()
const { toast } = useToast()

// 状态
const searchKeyword = ref('')
const selectedCategory = ref<string | undefined>(undefined)
const filterOpen = ref(false)
const jumpPageInput = ref<number | string>('')

// 筛选条件
const currentFilters = ref<{
  gi: string[]
  calorie: string[]
  protein: string[]
}>({
  gi: [],
  calorie: [],
  protein: [],
})

// 筛选选项
const giOptions = [
  { value: 'low', label: '低GI (≤55)', color: 'bg-green-500 text-white' },
  { value: 'medium', label: '中GI (56-70)', color: 'bg-yellow-500 text-white' },
  { value: 'high', label: '高GI (>70)', color: 'bg-red-500 text-white' },
]

const calorieOptions = [
  { value: 'low', label: '低热量 (<100kcal)' },
  { value: 'medium', label: '中热量 (100-300kcal)' },
  { value: 'high', label: '高热量 (>300kcal)' },
]

const proteinOptions = [
  { value: 'low', label: '低蛋白 (<5g)' },
  { value: 'medium', label: '中蛋白 (5-15g)' },
  { value: 'high', label: '高蛋白 (>15g)' },
]

// 计算属性
const isInitialLoading = computed(() => foodStore.loading && foodStore.foods.length === 0)

const activeFilterCount = computed(() => {
  let count = 0
  if (currentFilters.value.gi?.length) count += currentFilters.value.gi.length
  if (currentFilters.value.calorie?.length) count += currentFilters.value.calorie.length
  if (currentFilters.value.protein?.length) count += currentFilters.value.protein.length
  return count
})

// 初始化
onMounted(async () => {
  await foodStore.fetchCategories()
  await foodStore.fetchList({ reset: true })
})

// 方法
async function handleSearch() {
  await foodStore.search(searchKeyword.value)
}

async function handleClearSearch() {
  searchKeyword.value = ''
  await foodStore.search('')
}

async function handleCategoryChange(category: string | undefined) {
  selectedCategory.value = category
  await foodStore.filterByCategory(category)
}

function toggleFilter(type: 'gi' | 'calorie' | 'protein', value: string, checked: boolean | string) {
  const isChecked = checked === true
  const arr = currentFilters.value[type] || []
  
  if (isChecked) {
    if (!arr.includes(value)) {
      currentFilters.value[type] = [...arr, value]
    }
  } else {
    currentFilters.value[type] = arr.filter(v => v !== value)
  }
}

async function handleFilterApply() {
  // 前端筛选逻辑（后端暂不支持这些筛选）
  filterOpen.value = false
  toast({ description: '筛选已应用' })
}

async function handleFilterReset() {
  currentFilters.value = { gi: [], calorie: [], protein: [] }
  toast({ description: '筛选已重置' })
}

async function handlePageChange(page: number) {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  await foodStore.fetchList({ page })
}

async function handlePageJump() {
  const page = Number(jumpPageInput.value)
  if (!page || page < 1 || page > foodStore.pagination.totalPages) {
    toast({ description: `请输入有效页码（1-${foodStore.pagination.totalPages}）`, variant: 'destructive' })
    jumpPageInput.value = ''
    return
  }
  await handlePageChange(page)
  jumpPageInput.value = ''
}

function handleCardClick(id: number) {
  router.push(`/food/${id}`)
}

function handleToggleFavorite(id: number) {
  foodStore.toggleFavorite(id)
  const isFav = foodStore.isFavorite(id)
  toast({ description: isFav ? '已添加到收藏' : '已取消收藏' })
}

async function handleResetAll() {
  searchKeyword.value = ''
  selectedCategory.value = undefined
  currentFilters.value = { gi: [], calorie: [], protein: [] }
  await foodStore.reset()
  await foodStore.fetchList({ reset: true })
  toast({ description: '已重置所有筛选' })
}

function getEmptyDescription(): string {
  if (foodStore.error) return '加载失败，请重试'
  if (searchKeyword.value) return `未找到"${searchKeyword.value}"相关食物`
  if (selectedCategory.value) return '该分类暂无食物'
  return '暂无食物数据'
}
</script>
